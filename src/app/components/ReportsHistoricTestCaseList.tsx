import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { URL_API_ALB } from '@/config';
import { TimestampTabs } from './TimestampTabs';
import { toast } from 'sonner';

interface Props {
    visible: boolean;
    test: { testCaseId: string; [key: string]: any };
    viewMode: string;
}

interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
    size: number;
    compressed?: boolean;
}

const reportCache: { [testCaseId: string]: CacheEntry } = {};
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 50 * 1024 * 1024;
const LARGE_JSON_THRESHOLD = 1024 * 1024;
const pendingRequests = new Map<string, Promise<any>>();

const compressData = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        return btoa(jsonString);
    } catch (error) {
        console.error('Error compressing data:', error);
        return JSON.stringify(data);
    }
};

const decompressData = (compressedData: string): any => {
    try {
        const jsonString = atob(compressedData);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error decompressing data:', error);
        return null;
    }
};

const calculateObjectSize = (obj: any): number => {
    return new Blob([JSON.stringify(obj)]).size;
};

const manageCacheMemory = () => {
    const entries = Object.entries(reportCache);
    const totalSize = entries.reduce((sum, [_, entry]) => sum + entry.size, 0);
    
    if (totalSize > MAX_CACHE_SIZE) {
        entries.sort(([,a], [,b]) => a.timestamp - b.timestamp);
        
        let currentSize = totalSize;
        for (const [key, entry] of entries) {
            if (currentSize <= MAX_CACHE_SIZE * 0.8) break;
            delete reportCache[key];
            currentSize -= entry.size;
            console.log(`Removed cache entry for ${key} (${entry.size} bytes)`);
        }
    }
};

const cleanExpiredCache = () => {
    const now = Date.now();
    Object.keys(reportCache).forEach(key => {
        if (now - reportCache[key].timestamp > reportCache[key].ttl) {
            delete reportCache[key];
        }
    });
};

const streamFetchJSON = async (url: string, onProgress?: (progress: number) => void): Promise<any> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('ReadableStream not supported');
    }

    const chunks: Uint8Array[] = [];
    
    while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (onProgress && total > 0) {
            onProgress((loaded / total) * 100);
        }
    }

    const fullResponse = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
        fullResponse.set(chunk, position);
        position += chunk.length;
    }

    const text = new TextDecoder().decode(fullResponse);
    return JSON.parse(text);
};

const fetchWithOptimizations = async (url: string, options: RequestInit = {}, timeout = 30000): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const headResponse = await fetch(url, { 
            method: 'HEAD', 
            signal: controller.signal 
        });
        
        const contentLength = headResponse.headers.get('content-length');
        const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
        
        clearTimeout(timeoutId);
        
        if (fileSize > LARGE_JSON_THRESHOLD) {
            console.log(`Large JSON detected (${fileSize} bytes), using streaming...`);
            return await streamFetchJSON(url);
        } else {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        }
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

const processLargeJSON = async (data: any, chunkSize = 1000): Promise<any> => {
    return new Promise((resolve) => {
        const process = () => {
            resolve(data);
        };
        
        setTimeout(process, 0);
    });
};

const ReportTestCaseList: React.FC<Props> = ({ test, visible, viewMode }) => {
    const [isLoading, setLoading] = useState(true);
    const [report, setReport] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLargeFile, setIsLargeFile] = useState(false);

    const testCaseId = useMemo(() => test?.testCaseId, [test?.testCaseId]);

    const isCacheValid = useCallback((testCaseId: string): boolean => {
        const cached = reportCache[testCaseId];
        if (!cached) return false;
        
        const now = Date.now();
        return (now - cached.timestamp) < cached.ttl;
    }, []);

    const fetchReport = useCallback(async (testCaseId: string) => {
        if (isCacheValid(testCaseId)) {
            const cached = reportCache[testCaseId];
            let data = cached.data;
            
            if (cached.compressed) {
                data = decompressData(cached.data);
            }
            
            setReport(data);
            setLoading(false);
            setError(null);
            return;
        }

        if (pendingRequests.has(testCaseId)) {
            try {
                const result = await pendingRequests.get(testCaseId);
                setReport(result);
                setLoading(false);
                setError(null);
                return;
            } catch (err) {
                console.error('Error from pending request:', err);
            }
        }

        setLoading(true);
        setError(null);
        setLoadingProgress(0);

        const fetchPromise = (async () => {
            try {
                cleanExpiredCache();
                manageCacheMemory();

                const url = `${String(URL_API_ALB)}getReports`;
                
                const axiosConfig = {
                    timeout: 15000,
                    headers: { 'Content-Type': 'application/json' }
                };

                const res = await axios.post(url, { 
                    "type": "tests-reports",
                    id: testCaseId
                 }, axiosConfig);
                 const reports = res.data[testCaseId]

                 console.log('reports', reports);
                 reports.array.forEach((element:any) => {
                        console.log('element', element);
                        
                });
                
                // const reports: string =res.data[testCaseId][0].urlReport || res.data?.url || res.data?.reportUrl || res.data;

                // if (!reportJsonUrl) {
                //     throw new Error("Report URL not found in response");
                // }

                // try {
                //     const headResponse = await fetch(reportJsonUrl, { method: 'HEAD' });
                //     const contentLength = headResponse.headers.get('content-length');
                //     const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
                    
                //     if (fileSize > LARGE_JSON_THRESHOLD) {
                //         setIsLargeFile(true);
                //         console.log(`Large JSON file detected: ${fileSize} bytes`);
                //     }
                // } catch (headError) {
                //     console.warn('Could not get file size:', headError);
                // }

                // const reportData = await streamFetchJSON(reportJsonUrl, (progress) => {
                //     setLoadingProgress(progress);
                // });

                // const processedData = await processLargeJSON(reportData);
                
                // const dataSize = calculateObjectSize(processedData);
                // const shouldCompress = dataSize > LARGE_JSON_THRESHOLD;
                
                // const cacheEntry: CacheEntry = {
                //     data: shouldCompress ? compressData(processedData) : processedData,
                //     timestamp: Date.now(),
                //     ttl: CACHE_TTL,
                //     size: dataSize,
                //     compressed: shouldCompress
                // };
                
                // reportCache[testCaseId] = cacheEntry;
                
                // console.log(`Cached report: ${dataSize} bytes${shouldCompress ? ' (compressed)' : ''}`);
                
                // return processedData;

            } catch (err:any) {
                console.error('Error fetching report:', err);
                
                let errorMessage = `Failed to load report for test case ${testCaseId}.`;
                
                if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
                    errorMessage += ' Request timed out. Large files may take longer.';
                } else if (err.response?.status >= 500) {
                    errorMessage += ' Server error.';
                } else if (!navigator.onLine) {
                    errorMessage += ' No internet connection.';
                } else {
                    errorMessage += ' Please try again later or connect to VPN.';
                }

                throw new Error(errorMessage);
            } finally {
                pendingRequests.delete(testCaseId);
                setIsLargeFile(false);
                setLoadingProgress(0);
            }
        })();

        pendingRequests.set(testCaseId, fetchPromise);

        try {
            const result = await fetchPromise;
            setReport(result);
            setError(null);
        } catch (err:any) {
            console.error(err);
            setError(err.message);
            setReport(null);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [isCacheValid]);

    useEffect(() => {
        if (testCaseId && viewMode === "Historic reports") {
            if (!isCacheValid(testCaseId) && !visible) {
                const cached = reportCache[testCaseId];
                if (!cached || cached.size < LARGE_JSON_THRESHOLD) {
                    fetchReport(testCaseId).catch(() => {});
                }
            }
        }
    }, [testCaseId, viewMode, fetchReport, isCacheValid, visible]);

    useEffect(() => {
        if (!visible || !testCaseId || viewMode !== "Historic reports") return;
        fetchReport(testCaseId);
    }, [visible, testCaseId, viewMode, fetchReport]);

    if (!visible) return null;

    if (isLoading) {
        return (
            <div className="p-6 flex flex-col justify-center items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
                <div className="text-center">
                    <span className="text-base text-primary/80 font-semibold">
                        {isLargeFile ? 'Loading large report...' : 'Loading report...'}
                    </span>
                    {isLargeFile && loadingProgress > 0 && (
                        <div className="mt-2 w-48">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                                {Math.round(loadingProgress)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col justify-center items-center gap-2">
                <svg viewBox="0 0 48 48" className="h-10 w-10 text-red-500" fill="none">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                    <line x1="15" y1="15" x2="33" y2="33" stroke="currentColor" strokeWidth="2" />
                    <line x1="33" y1="15" x2="15" y2="33" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="text-base text-red-600 font-semibold">Error loading report</span>
                <span className="text-xs text-muted-foreground text-center max-w-md">{error}</span>
                <button 
                    onClick={() => fetchReport(testCaseId)}
                    className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    console.log(`Report for ${testCaseId} loaded successfully`, report);
    

    if (!report) {
        return (
            <div className="p-6 flex flex-col justify-center items-center gap-2">
                <svg viewBox="0 0 48 48" className="h-10 w-10 text-primary/50" fill="none">
                    <rect x="8" y="4" width="24" height="36" rx="4" stroke="currentColor" strokeWidth="2" fill="white" />
                    <path d="M20 32h4M16 20h12M16 26h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="36" cy="36" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
                    <line x1="39.5" y1="39.5" x2="44" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-base text-primary/70 font-semibold">No report found for this test case.</span>
                <span className="text-xs text-muted-foreground">Try generating or running this test to see its history.</span>
            </div>
        );
    }

    const cached = reportCache[testCaseId];
    const isCompressed = cached?.compressed || false;
    const cacheSize = cached?.size || 0;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-primary/80">Historic Report</h2>
                <div className="flex items-center gap-2">
                    {isCacheValid(testCaseId) && (
                        <span className="text-xs text-primary/70 bg-primary/20 px-2 py-1 rounded">
                            Cached {isCompressed ? '(Compressed)' : ''}
                        </span>
                    )}
                    {cacheSize > 0 && (
                        <span className="text-xs text-primary/70 bg-primary/20 px-2 py-1 rounded">
                            {(cacheSize / 1024).toFixed(1)}KB
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-2">
                <TimestampTabs reports={report?.reports} />
            </div>
        </div>
    );
};

export default ReportTestCaseList;
