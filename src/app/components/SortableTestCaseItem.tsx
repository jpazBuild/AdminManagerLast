import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Eye, File, FileChartColumn, Locate, Plus, Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import CopyToClipboard from "./CopyToClipboard";
import StepActions from "./StepActions";
import InteractionItem from "./Interaction";
import { FakerInputWithAutocomplete } from "./FakerInput";
import { toast } from "sonner";
import { handleAxiosRequest } from "@/utils/handleAxiosRequest";
import axios from "axios";
import { TestCase } from "@/types/TestCase";
import ReusableStepModal from "./ReusableStepModal";
import { URL_API_ALB } from "@/config";
import TestCaseActions from "./TestCaseActions";

const useScrollPosition = (dependencies: any[]) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollPosition = useRef(0);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const handleScroll = () => {
            scrollPosition.current = element.scrollTop;
        };

        element.addEventListener('scroll', handleScroll, { passive: true });
        return () => element.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const element = scrollRef.current;
        if (element && scrollPosition.current > 0) {
            requestAnimationFrame(() => {
                element.scrollTop = scrollPosition.current;
            });
        }
    }, dependencies);

    return scrollRef;
};

interface Props {
    test: TestCase;
    index: number;
    selectedCases: string[];
    toggleSelect: (id: string) => void;
    setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
    openItems: string[];
    viewMode: string;
    setViewMode: React.Dispatch<React.SetStateAction<'data' | 'steps' | 'editLocation'>>;
    setTestCasesData: React.Dispatch<React.SetStateAction<TestCase[]>>;
    testCasesData: TestCase[];
    getFieldValue: (id: string, field: string) => string;
    handleValueChange: (field: string, value: string, id: string) => void;
    testFields: string[];
    onRefreshAfterUpdateOrDelete: () => void;
    dynamicValues: any[];
    setDynamicValues: React.Dispatch<React.SetStateAction<any[]>>;
    isDarkMode?: boolean;
}

const SortableTestCaseItem: React.FC<Props> = ({
    test,
    index,
    selectedCases,
    toggleSelect,
    setOpenItems,
    openItems,
    setTestCasesData,
    testCasesData,
    getFieldValue,
    handleValueChange,
    testFields,
    onRefreshAfterUpdateOrDelete,
    dynamicValues,
    setDynamicValues,
    isDarkMode = false,
}) => {
    const currentTestCase = testCasesData.find(tc => tc?.id === test?.id);
    const steps = currentTestCase?.stepsData ?? [];
    const [viewMode, setViewMode] = useState<'data' | 'steps' | 'editLocation' | 'Historic reports'>('data');
    const [responseTest, setResponseTest] = useState<any>(null);
    const [flatReusableSteps, setFlatReusableSteps] = useState(false);
    const [selectedStepsForReusable, setSelectedStepsForReusable] = useState<number[]>([]);
    const [showReusableModal, setShowReusableModal] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [dataResponseReusable, setDataResponseReusable] = useState<any>(null);
    const scrollRef = useScrollPosition([
        viewMode,
        openItems,
        selectedCases,
        steps.length,
        testCasesData.length
    ]);

    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [jsonValue, setJsonValue] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);

    const [isLoadingTest, setIsLoadingTest] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

    const isOpen = useMemo(() => openItems.includes(test.id ?? ''), [openItems, test.id]);
    const testId = useMemo(() => test.id ?? '', [test.id]);

    const fetchTestData = useCallback(async (flatReusable: boolean) => {
        if (!testId) return;

        setIsLoadingTest(true);
        try {
            const response = await axios.post(`${URL_API_ALB}tests`, {
                id: testId,
                flatReusableSteps: flatReusable
            });
            setResponseTest(response.data[0]);
            setHasFetched(true);
        } catch (err) {
            console.error("Error fetching test:", err);
            toast.error("Error fetching test data");
        } finally {
            setIsLoadingTest(false);
        }
    }, [testId]);

    useEffect(() => {
        if (!responseTest?.id) return;

        setTestCasesData(prevCases => {
            const idx = prevCases.findIndex(tc => tc.id === responseTest.id);
            if (idx === -1) return prevCases;

            const currentCase = prevCases[idx];

            const newCase = {
                ...currentCase,
                ...responseTest,
                testData: responseTest.testDataObj || {},
                originalTestData: responseTest.testData || [],
                stepsData: responseTest.stepsData || []
            };

            const isStepsSame =
                JSON.stringify(currentCase.stepsData || []) ===
                JSON.stringify(responseTest.stepsData || []);
            const isTestDataSame =
                JSON.stringify(currentCase.testData || {}) ===
                JSON.stringify(responseTest.testDataObj || {});

            const isFirstLoad = !currentCase.testData;

            if (!isFirstLoad && isStepsSame && isTestDataSame) {
                return prevCases;
            }

            const newCases = [...prevCases];
            newCases[idx] = newCase;
            return newCases;
        });
    }, [
        responseTest?.id,
        responseTest?.testData,
        responseTest?.testDataObj,
        responseTest?.stepsData,
        setTestCasesData
    ]);




    useEffect(() => {
        if (isOpen && !hasFetched) {
            fetchTestData(flatReusableSteps);
        }
    }, [isOpen, hasFetched, fetchTestData, flatReusableSteps]);

    useEffect(() => {
        if (hasFetched && isOpen) {
            fetchTestData(flatReusableSteps);
        }
    }, [flatReusableSteps, hasFetched, isOpen, fetchTestData]);

    const handleCloneOpen = useCallback(() => {
        const { id, createdAt, ...cloneData } = test;
        if (test.jsonSteps) cloneData.jsonSteps = test.jsonSteps;
        setJsonValue(JSON.stringify({
            ...cloneData,
            testCaseName: `${test.testCaseName} (Clon)`,
            testCaseId: undefined,
            createdAt: undefined,
        }, null, 2));
        setJsonError(null);
        setCloneModalOpen(true);
    }, [test]);

    const handleDelete = useCallback(async () => {
        const res = await handleAxiosRequest(() =>
            axios.delete(`${URL_API_ALB?.replace(/\/+$/, "")}tests`, {
                data: { id: test.id },
            }),
            "Test case deleted successfully"
        );

        if (res) {
            setTestCasesData(prev => prev.filter(tc => tc.id !== test.id));
            setDynamicValues(prev => prev.filter(val => val.id !== test.id));
            onRefreshAfterUpdateOrDelete();
        }
    }, [test.id, setTestCasesData, setDynamicValues, onRefreshAfterUpdateOrDelete]);

   const handleToggleSelect = useCallback(() => {
    toggleSelect(testId);

        setOpenItems((prev) => {
            if (!prev.includes(testId)) {
                return [...prev, testId];
            }
            return prev;
        });
    }, [toggleSelect, testId, setOpenItems]);

    const handleAccordionToggle = useCallback(() => {
        setOpenItems(prev =>
            prev.includes(testId)
                ? prev.filter(id => id !== testId)
                : [...prev, testId]
        );
    }, [setOpenItems, testId]);

    const handleStepSelection = useCallback((stepIndex: number) => {
        if (!selectionMode) return;

        setSelectedStepsForReusable(prev => {
            if (prev?.includes(stepIndex)) {
                return prev.filter(i => i !== stepIndex);
            } else {
                return [...prev, stepIndex].sort((a, b) => a - b);
            }
        });
    }, [selectionMode]);

    const handleCreateReusableStep = useCallback(async (reusableData: any) => {
        console.log("Creating reusable step with data:", reusableData);
        try {
            if (reusableData?.data?.error) {
                toast.error(reusableData.data.error);
                return;
            }
            const remainingSteps = responseTest.stepsData.filter((_: any, index: number) =>
                !selectedStepsForReusable.includes(index)
            );

            const insertPosition = Math.min(...selectedStepsForReusable);

            const newStepsData = [
                ...remainingSteps.slice(0, insertPosition),
                reusableData,
                ...remainingSteps.slice(insertPosition)
            ].map((step, index) => ({
                ...step,
                indexStep: index + 1
            }));

            setResponseTest((prev: any) => ({
                ...prev,
                stepsData: newStepsData
            }));

            setTestCasesData(prev => {
                const newData = [...prev];
                const tcIndex = newData.findIndex(tc => tc.id === test.id);
                if (tcIndex !== -1) {
                    newData[tcIndex] = {
                        ...newData[tcIndex],
                        stepsData: newStepsData
                    };
                }
                return newData;
            });

            setSelectedStepsForReusable([]);
            setSelectionMode(false);

            toast.success('Reusable step created successfully');
        } catch (error) {
            console.error('Error creating reusable step:', error);
            toast.error('Failed to create reusable step');
        }
    }, [responseTest, selectedStepsForReusable, test.id, setTestCasesData]);

    const handleResponseCreateReusedStep = useCallback(async (data: {}) => {
        console.log("Data reusable create:", data);
        setDataResponseReusable(data);
    }, []);

    const handleUpdateReusableStep = useCallback(async (stepIndex: number, updatedReusableData: any) => {
        try {
            const newStepsData = [...responseTest?.stepsData];
            newStepsData[stepIndex] = updatedReusableData;

            setResponseTest((prev: any) => ({
                ...prev,
                stepsData: newStepsData
            }));

            setTestCasesData(prev => {
                const newData = [...prev];
                const tcIndex = newData.findIndex(tc => tc?.id === test?.id);
                if (tcIndex !== -1) {
                    newData[tcIndex] = {
                        ...newData[tcIndex],
                        stepsData: newStepsData
                    };
                }
                return newData;
            });

            toast.success('Reusable step updated successfully');
        } catch (error) {
            console.error('Error updating reusable step:', error);
            toast.error('Failed to update reusable step');
        }
    }, [responseTest?.stepsData, test?.id, setTestCasesData]);

    const styleClasses = useMemo(() => ({
        mainContainer: isDarkMode
            ? "w-full shadow-xl p-2 rounded-md border-l-4 border-2 border-slate-400 pt-1 bg-gray-800 text-white"
            : "w-full shadow-xl rounded-md border-l-4 border-2 border-primary/90 pt-1 bg-white",
        header: isDarkMode
            ? "flex items-center w-full bg-gray-700/50 p-0.5 rounded"
            : "flex items-center w-full bg-primary/5 p-0.5",
        idContainer: isDarkMode
            ? "flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-gray-500"
            : "flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20",
        idText: isDarkMode
            ? "text-xs font-mono text-gray-400"
            : "text-xs font-mono text-muted-foreground",
        createdBy: isDarkMode
            ? "text-xs text-white/70 px-2 py-1 rounded-md shadow-md bg-gray-700"
            : "text-xs text-primary/80 px-2 py-1 rounded-md shadow-md",
        title: isDarkMode
            ? "font-medium mt-2 px-2 break-words text-white"
            : "font-medium mt-2 px-2 break-words",
        dynamicFieldsLabel: isDarkMode
            ? "text-xs text-gray-400"
            : "text-xs text-primary/70",
        dynamicField: isDarkMode
            ? "text-xs text-gray-400 px-2 py-0.5 rounded-full bg-gray-700 max-w-[220px] break-words truncate"
            : "text-xs text-primary/70 px-2 py-0.5 rounded-full bg-primary/5 max-w-[220px] break-words truncate",
        stepsInfo: isDarkMode
            ? "flex justify-between px-2 text-[11px] text-gray-400"
            : "flex justify-between px-2 text-[11px] text-primary/80",
        scrollContainer: isDarkMode
            ? "flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 mt-4 p-2 bg-gray-800"
            : "flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 mt-4 p-2",
        stepsScrollContainer: isDarkMode
            ? "flex flex-col gap-4 max-h-[100vh] overflow-y-auto px-1 bg-gray-800"
            : "flex flex-col gap-4 max-h-[100vh] overflow-y-auto px-1 py-2",
        label: isDarkMode
            ? "w-full text-white/70 break-words max-w-[480px] truncate"
            : "w-full text-primary/90 break-words max-w-[480px] truncate",
        checkbox: isDarkMode
            ? "cursor-pointer border-gray-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            : "cursor-pointer",
        stepsStickyHeader: isDarkMode
            ? "sticky flex flex-col top-0 z-20 bg-gray-800 p-3 border rounded-lg mb-4 shadow-md border-gray-600"
            : "sticky flex flex-col top-0 z-20 bg-white p-3 border rounded-lg mb-4 shadow-md",
        copyAllSteps: isDarkMode
            ? "self-end text-white p-2 rounded-md border mt-2 flex items-center gap-2 border-gray-600"
            : "self-end text-primary/90 border-primary/40 p-2 rounded-md border mt-2 flex items-center gap-2"
    }), [isDarkMode]);

    const getTagClasses = useCallback((opacity: string) => {
        if (isDarkMode) {
            return `text-xs text-white px-2 py-1 rounded-full ${opacity === '85' ? 'bg-slate-500' :
                opacity === '65' ? 'bg-slate-500' :
                    'bg-slate-600'
                }`;
        } else {
            return `text-xs bg-primary/${opacity} text-white px-2 py-1 rounded-full`;
        }
    }, [isDarkMode]);

    const getViewModeButtonClasses = useCallback((mode: string) => {
        const isActive = viewMode === mode;
        return isDarkMode
            ? `rounded-md flex gap-2 p-2 cursor-pointer items-center shadow-md transition-colors ${isActive
                ? 'bg-slate-400 text-white border-b-4 border-slate-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`
            : `rounded-md flex gap-2 p-2 border cursor-pointer items-center bg-white shadow-md text-primary/70 ${isActive ? 'border-b-4 border-primary' : 'hover:bg-gray-50'
            }`;
    }, [viewMode, isDarkMode]);

    const getStepSelectionClasses = useCallback((stepIndex: number) => {
        const isSelected = selectedStepsForReusable.includes(stepIndex);
        const baseClasses = selectionMode ? "cursor-pointer border-2 transition-all duration-200" : "";

        if (!selectionMode) return "";

        return isDarkMode
            ? `${baseClasses} ${isSelected ? 'border-yellow-400 bg-yellow-900/20' : 'border-gray-600 hover:border-gray-500'}`
            : `rounded-md ${baseClasses} ${isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 hover:border-gray-400'}`;
    }, [selectionMode, selectedStepsForReusable, isDarkMode]);

    const buildUpdatePayload = useCallback((responseTest: any, updatedBy: string) => {
        const seenIds = new Set<string>();

        const transformedSteps = responseTest.stepsData.map((step: any) => {
            if (!step) return step;

            const { stepsId, ...cleanStep } = step;

            if (cleanStep?.stepsData && Array.isArray(cleanStep.stepsData)) {
                return cleanStep.id;
            }

            return cleanStep;
        });

        const uniqueSteps = transformedSteps.filter((step: any) => {
            const stepId = typeof step === "string" ? step : step.id;

            if (!stepId) return true;

            if (seenIds.has(stepId)) return false;
            seenIds.add(stepId);
            return true;
        });

        return {
            id: responseTest.id,
            name: responseTest.name,
            description: responseTest.description,
            groupName: responseTest.groupName,
            moduleName: responseTest.moduleName,
            subModuleName: responseTest.subModuleName,
            tagIds: responseTest.tagIds || [],
            tagNames: responseTest.tagNames || [],
            contextGeneral: responseTest.contextGeneral,
            stepsData: uniqueSteps,
            updatedBy,
            deleteS3Images: true,
            temp: false,
        };
    }, []);

    const handleUpdateConfirm = useCallback(async () => {
        if (!responseTest) {
            toast.error("No test data available to update");
            return;
        }

        const payload = buildUpdatePayload(responseTest, "Niyi");
        console.log("Payload final para updateTest:", payload);

        try {
            setIsLoadingUpdate(true);            
            const apiUrl = (URL_API_ALB ?? '');
            const res = await axios.patch(`${apiUrl}tests`, payload);

            if (res.status === 200) toast.success("Test updated successfully");
        } catch (error:any) {
            toast.error("Failed to update test case",error);
        } finally {
            setIsLoadingUpdate(false);
        }
    }, [responseTest, buildUpdatePayload]);

    const uniqueFields = useMemo(() => Array.from(new Set(testFields)), [testFields]);

    return (
        <div className={styleClasses.mainContainer}>
            <TestCaseActions
                test={currentTestCase}
                onDelete={handleDelete}
                onUpdate={handleUpdateConfirm}
                isLoadingUpdate={isLoadingUpdate}
                isDarkMode={isDarkMode}
            />

            <AccordionItem value={(test.testCaseId || test.id) ?? ''} className="rounded-lg">
                <div className={styleClasses.header}>
                    <Checkbox
                        id={(test.testCaseId || test.id) ?? ''}
                        checked={selectedCases.includes(test.id ?? '')}
                        onCheckedChange={handleToggleSelect}
                        className={styleClasses.checkbox}
                    />
                    <AccordionTrigger
                        className="flex hover:no-underline"
                        onClick={handleAccordionToggle}
                    >
                        <div className="flex flex-col w-full break-words">
                            <div className="flex justify-between gap-2 p-1 text-[10px]">
                                <div className={styleClasses.idContainer}>
                                    <span className={styleClasses.idText}>
                                        Id: {test.testCaseId || test.id}
                                    </span>
                                    {(test.testCaseId || test.id) && <CopyToClipboard text={String(test.testCaseId || test.id)} isDarkMode={isDarkMode} />}
                                </div>
                                <span className={styleClasses.createdBy}>
                                    {test.createdBy}
                                </span>
                            </div>
                            <h3 className={styleClasses.title}>{test.testCaseName || test.name}</h3>

                            {testFields.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 px-2 py-0.5 w-full">
                                    <span className={styleClasses.dynamicFieldsLabel}>Dynamic fields:</span>
                                    {uniqueFields?.map((field) => (
                                        <span
                                            key={`field-${field}-${test.testCaseId || test.id}-${index}`}
                                            className={styleClasses.dynamicField}
                                            title={field}
                                        >
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className={styleClasses.stepsInfo}>
                                <span></span>
                                <span className="text-[11px]">
                                    {test.createdAt
                                        ? new Intl.DateTimeFormat('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }).format(Number(test.createdAt))
                                        : ""}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 px-2">
                                {test.tagNames && test.tagNames.length > 0 && (
                                    (Array.isArray(test.tagNames) ? test.tagNames : [test.tagNames]).map((tag, idx) => (
                                        tag && (
                                            <span key={idx} className={getTagClasses('85')}>
                                                {tag.trim()}
                                            </span>
                                        )
                                    ))
                                )}
                                {test.groupName && (
                                    <span className={getTagClasses('85')}>
                                        {test.groupName}
                                    </span>
                                )}
                                {test.moduleName && (
                                    <span className={getTagClasses('65')}>
                                        {test.moduleName}
                                    </span>
                                )}
                                {test.subModuleName && (
                                    <span className={getTagClasses('50')}>
                                        {test.subModuleName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                </div>

                <AccordionContent className="p-2 w-full">
                    <div className="flex gap-2 overflow-x-auto">
                        {['data', 'steps', 'Historic reports'].map(mode => (
                            <button
                                key={mode}
                                className={getViewModeButtonClasses(mode)}
                                onClick={() => setViewMode(mode as any)}
                            >
                                {mode === 'editLocation' ? <Locate className="ml-1 h-6 w-6" /> :
                                    mode === 'data' ? <File className="ml-1" /> : mode === 'Historic reports' ? <FileChartColumn className="h-6 w-6" /> : <Eye className="ml-1" />}
                                {mode === 'editLocation' ? 'Edit Location' :
                                    mode === 'data' ? 'See Data' : mode === 'Historic reports' ? 'Historic reports' : 'See Steps'}
                            </button>
                        ))}
                    </div>

                    {viewMode === 'data' && (
                        <div
                            ref={scrollRef}
                            className={styleClasses.scrollContainer}
                        >
                            {!isLoadingTest && responseTest?.testData?.map((field: string, idx: number) => (
                                <div key={`${field}-${idx}`} className="flex flex-col gap-4 px-1 break-words">
                                    <Label className={styleClasses.label}>{field}</Label>
                                    <FakerInputWithAutocomplete
                                        id={`${field}-${test.testCaseId || test.id}`}
                                        value={getFieldValue((test.testCaseId || test.id) ?? '', field)}
                                        placeholder={`Enter ${field}`}
                                        isDarkMode={isDarkMode}
                                        onChange={(val) => {
                                            const testId = (test.testCaseId || test.id) ?? '';

                                            handleValueChange(field, val, testId);

                                            setResponseTest((prev: any) => {
                                                if (!prev) return prev;

                                                const allFields = prev.testData || [];
                                                const updatedTestDataObj: Record<string, string> = {};

                                                allFields.forEach((f: string) => {
                                                    const currentVal =
                                                        f === field
                                                            ? val
                                                            : getFieldValue(testId, f) || "";
                                                    updatedTestDataObj[f] = currentVal;
                                                });

                                                setTestCasesData(prevCases =>
                                                    prevCases.map(tc =>
                                                        tc.id === testId
                                                            ? { ...tc, testData: updatedTestDataObj }
                                                            : tc
                                                    )
                                                );

                                                return {
                                                    ...prev,
                                                    testDataObj: updatedTestDataObj
                                                };
                                            });
                                        }}
                                    />
                                </div>
                            ))}

                            {isLoadingTest && (
                                <div className="flex justify-center items-center h-32">
                                    <span className="text-gray-500">Loading data...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'steps' && (
                        <div
                            ref={scrollRef}
                            className={styleClasses.stepsScrollContainer}
                        >
                            <div className={styleClasses.stepsStickyHeader}>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center space-x-2 space-y-2">
                                        <Switch
                                            id="flat-reusable"
                                            checked={flatReusableSteps}
                                            onCheckedChange={setFlatReusableSteps}
                                        />
                                        <Label htmlFor="flat-reusable" className="text-sm">
                                            Flat View (Show all steps directly)
                                        </Label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={selectionMode ? "destructive" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setSelectionMode(!selectionMode);
                                                setSelectedStepsForReusable([]);
                                            }}
                                            className={`${isDarkMode
                                                ? 'bg-gray-700 text-white border-white/40'
                                                : 'bg-gray-200 text-gray-900 border-primary/40'
                                                } border shadow-md cursor-pointer flex items-center`}
                                        >
                                            <Settings className="w-4 h-4 mr-1" />
                                            {selectionMode ? 'Cancel Selection' : 'Select Steps for Reusable'}
                                        </Button>

                                        {selectionMode && selectedStepsForReusable.length > 0 && (
                                            <Button
                                                size="sm"
                                                onClick={() => setShowReusableModal(true)}
                                                className="bg-primary/90 text-white cursor-pointer flex items-center"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Create Reusable ({selectedStepsForReusable.length})
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className={styleClasses.copyAllSteps}>
                                    <span>Copy All steps</span>
                                    <CopyToClipboard
                                        text={JSON.stringify(responseTest?.stepsData)}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            </div>

                            <StepActions
                                index={-1}
                                steps={responseTest?.stepsData || []}
                                test={{ ...test }}
                                setTestCasesData={setTestCasesData}
                                setResponseTest={setResponseTest}
                            />

                            {isLoadingTest && (
                                <div className="flex justify-center items-center h-32">
                                    <span className="text-gray-500">Loading steps...</span>
                                </div>
                            )}

                            {!isLoadingTest && responseTest?.stepsData?.map((step: any, i: number) => (
                                <div key={i} className="flex flex-col">
                                    <div
                                        className={getStepSelectionClasses(i)}
                                        onClick={() => handleStepSelection(i)}
                                    >
                                        {selectionMode && (
                                            <div className="absolute top-2 left-2 z-10">
                                                <Checkbox
                                                    checked={selectedStepsForReusable.includes(i)}
                                                    onCheckedChange={() => handleStepSelection(i)}
                                                />
                                            </div>
                                        )}

                                        <InteractionItem
                                            data={{ id: `${test.testCaseId || test.id}-step-${i}`, ...step }}
                                            index={i}
                                            onDelete={(idx) => {
                                                setResponseTest((prev: any) => {
                                                    if (!prev) return prev;
                                                    const updatedSteps = prev.stepsData.filter((_: any, j: number) => j !== idx)
                                                        .map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
                                                    return { ...prev, stepsData: updatedSteps };
                                                });

                                                setTestCasesData(prev => {
                                                    const newData = [...prev];
                                                    const tc = { ...newData[index] };
                                                    tc.stepsData = tc.stepsData?.filter((_, j) => j !== idx) || [];
                                                    newData[index] = tc;
                                                    return newData;
                                                });

                                                setSelectedStepsForReusable(prev =>
                                                    prev.filter(stepIdx => stepIdx !== idx)
                                                        .map(stepIdx => stepIdx > idx ? stepIdx - 1 : stepIdx)
                                                );
                                            }}
                                            onUpdate={(idx, newStep) => {
                                                if (newStep.type?.startsWith('STEPS') && Array.isArray(newStep.stepsData)) {
                                                    handleUpdateReusableStep(idx, newStep);
                                                    return;
                                                }

                                                setResponseTest((prev: any) => {
                                                    if (!prev) return prev;
                                                    const updatedSteps = [...prev.stepsData];
                                                    updatedSteps[idx] = { ...updatedSteps[idx], ...newStep };
                                                    return { ...prev, stepsData: updatedSteps };
                                                });

                                                setTestCasesData(prev => {
                                                    const newData = [...prev];
                                                    const tc = { ...newData[index] };
                                                    const stepsData = [...(tc.stepsData || [])];
                                                    stepsData[idx] = { ...stepsData[idx], ...newStep };
                                                    tc.stepsData = stepsData;
                                                    newData[index] = tc;
                                                    return newData;
                                                });
                                            }}
                                            isDarkMode={isDarkMode}
                                            test={test}
                                            setTestCasesData={setTestCasesData}
                                            setResponseTest={setResponseTest}
                                        />
                                    </div>

                                    <StepActions
                                        index={i}
                                        steps={responseTest?.stepsData || []}
                                        test={{ ...test }}
                                        setTestCasesData={setTestCasesData}
                                        setResponseTest={setResponseTest}
                                    />
                                </div>
                            ))}

                            <ReusableStepModal
                                isOpen={showReusableModal}
                                onClose={() => setShowReusableModal(false)}
                                selectedSteps={selectedStepsForReusable}
                                steps={responseTest?.stepsData || []}
                                onCreateReusable={handleCreateReusableStep}
                                isDarkMode={isDarkMode}
                                responseTest={responseTest}
                                onSetResponseData={handleResponseCreateReusedStep}
                            />
                        </div>
                    )}

                    {viewMode === 'Historic reports' && test.id && (
                        <div className="p-4">
                            <div className="text-center text-gray-500">
                                Pending
                            </div>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </div>
    );
};

export default React.memo(SortableTestCaseItem);