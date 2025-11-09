"use client";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import axios from "axios";
import { ArrowLeft, Save, X, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, Fragment, useRef } from "react";
import { toast } from "sonner";
import { updateTest } from "@/utils/DBBUtils";
import { ExecutionSummary } from "@/app/components/ExecutionSummary";
import { useTestExecution } from "@/app/hooks/useTestExecution";
import { ImageModalWithZoom } from "@/app/components/Report";
import NoData from "@/app/components/NoData";
import LoadingSkeleton from "@/app/components/loadingSkeleton";
import Link from "next/link";
import ModalAddSuite from "./components/ModalAddSuite";
import ModalDeleteTest from "./components/ModalDeleteTest";
import FilterTable from "./components/FilterTable";
import RowTable from "./components/RowTable";
import ShowData from "./components/ShowData";
import ShowReport from "./components/ShowReport";
import ShowSteps from "./components/ShowSteps";
import { getUiThemeClasses } from "./utils/stylesComponents";
import DetailSuite from "./components/DetailSuite";
import { useSuiteMeta } from "./hooks/useSuiteMeta";
import { useDynamicData } from "./hooks/useDynamicData";
import { useSuiteSearchModal } from "./hooks/useSuiteSearchModal";
import { useBulkVisibleSelection } from "./hooks/useBulkVisibleSelection";

type BatchItem = string | { id: string };
type SuiteResponse = {
    id: string;
    name: string;
    description?: string;
    tagNames?: string[];
    createdByName?: string;
    createdAt?: number;
    batchItems?: {
        count?: number;
        array?: BatchItem[];
    };
};

type TestHeader = {
    id: string;
    name?: string;
    description?: string;
    groupName?: string;
    moduleName?: string;
    subModuleName?: string;
    tagNames?: string[];
    createdByName?: string;
    createdAt?: number | string;
};

type Step = any;

type FullTest = TestHeader & {
    testData?: string[];
    testDataObj?: Record<string, any>;
    stepsData?: Step[];
};

const toId = (item: BatchItem) => (typeof item === "string" ? item : item?.id);


const toEditable = (t: FullTest) => {
    const keys = Array.isArray(t.testData) ? t.testData : Object.keys(t.testDataObj || {});
    const values: Record<string, any> = { ...(t.testDataObj || {}) };
    keys.forEach((k) => (values[k] = values[k] ?? ""));
    return { keys, values };
};


const buildReportCustomName = (suite?: SuiteResponse | null, testId?: string) => {
    const base = suite?.id || "suite";
    return `${base}-${testId}`;
};
const isPlainEmptyObject = (v: any) =>
    v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;

const TestSuiteId = () => {
    const { idSuite } = useParams<{ idSuite: string }>();
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [suiteDetails, setSuiteDetails] = useState<SuiteResponse | null>(null);
    const [isLoadingSuiteDetails, setIsLoadingSuiteDetails] = useState(false);
    const [errorSuite, setErrorSuite] = useState<string | null>(null);
    const [suiteTests, setSuiteTests] = useState<TestHeader[]>([]);
    const [dataBufById, setDataBufById] = useState<Record<string, Record<string, any>>>({});

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [loadingTest, setLoadingTest] = useState<Record<string, boolean>>({});
    const [savingTest, setSavingTest] = useState<Record<string, boolean>>({});
    const [fullById, setFullById] = useState<any>({});
    const [stepsBufById, setStepsBufById] = useState<Record<string, Step[]>>({});
    const [showData, setShowData] = useState<Record<string, boolean>>({});
    const [showSteps, setShowSteps] = useState<Record<string, boolean>>({});


    const [openAddModal, setOpenAddModal] = useState(false);


    const [isHeadless, setIsHeadless] = useState<boolean>(true);



    const [showReports, setShowReports] = useState<Record<string, boolean>>({});
    const [reportsTabById, setReportsTabById] = useState<Record<string, "live" | "saved">>({});

    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<string | null>(null);

    const [historicById, setHistoricById] = useState<Record<string, any[]>>({});
    const [loadingHistoric, setLoadingHistoric] = useState<Record<string, boolean>>({});
    const [errorHistoric, setErrorHistoric] = useState<Record<string, string | null>>({});
    const [historicMetaById, setHistoricMetaById] = useState<
        Record<string, { fetched: boolean; empty: boolean; lastAt?: number; error?: string | null }>
    >({});
    const [historicUrlById, setHistoricUrlById] = useState<Record<string, string | undefined>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [suiteSummary, setSuiteSummary] = useState({ total: 0, passed: 0, failed: 0, pending: 0 });
    const [summaryTick, setSummaryTick] = useState(0);
    const [statusById, setStatusById] = useState<Record<string, "passed" | "failed" | "pending">>({});

    const [filterTag, setFilterTag] = useState<string>("");
    const [filterGroup, setFilterGroup] = useState<string>("");
    const [filterModule, setFilterModule] = useState<string>("");
    const [filterSubmodule, setFilterSubmodule] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<"" | "passed" | "failed" | "pending">("");
    const [selectionModeById, setSelectionModeById] = useState<Record<string, boolean>>({});
    const [isLoadingComputedData, setIsLoadingComputedData] = useState<boolean>(false);
    const [selectedStepsForReusableById, setSelectedStepsForReusableById] = useState<Record<string, number[]>>({});
    const [showReusableModalById, setShowReusableModalById] = useState<Record<string, boolean>>({});

    const {
        editingTitle, setEditingTitle,
        editingDesc, setEditingDesc,
        titleDraft, setTitleDraft,
        descDraft, setDescDraft,
        savingMeta,
        commitTitle, commitDesc,
    } = useSuiteMeta(suiteDetails);

    const {
        dynamicDataHeaders,
        selectedDynamicDataId,
        setSelectedDynamicDataId,
        testData,
        ddCount,
        handleSaveDynamicData,
        savingDDById,
    } = useDynamicData({ dataBufById, setDataBufById });



    const {
        tags, groups, modules, submodules, users,
        selectedTag, setSelectedTag,
        selectedGroup, setSelectedGroup,
        selectedModule, setSelectedModule,
        selectedSubmodule, setSelectedSubmodule,
        selectedCreatedBy, setSelectedCreatedBy,
        isLoadingTags, isLoadingGroups, isLoadingModules, isLoadingSubmodules, loadingUsers,
        searchTestCaseName, setSearchTestCaseName,
        searchTestCaseId, setSearchTestCaseId,
        isSearchingTC, handleSearchModal,
        searchResults,
        selectedCaseIdsForAdd, setSelectedCaseIdsForAdd,
        toggleSelectResult,
        userOptions,
    } = useSuiteSearchModal(openAddModal);

    const {
        allVisibleSelected, someVisibleSelected, toggleAllVisible
    } = useBulkVisibleSelection(searchResults, selectedCaseIdsForAdd, setSelectedCaseIdsForAdd);



    useEffect(() => {
        if (suiteDetails) {
            setTitleDraft(suiteDetails.name || "");
            setDescDraft(suiteDetails.description || "");
        }
    }, [suiteDetails?.id]);

    const transformedStepsToCopy = useCallback((steps: any[]) => steps, []);


    const getPerTestData = useCallback((testId: string) => {
        if (dataBufById?.[testId]) return dataBufById[testId];

        if (testData?.data?.[testId]) return testData.data[testId];

        const full = fullById?.[testId];
        if (full) return toEditable(full).values;

        return undefined;
    }, [dataBufById, testData, fullById]);

    const { reports, loading, progress, executeTests, idReports, stopTest, stopped, setLoading, setStopped, runSingleTest, stopAll } =
        useTestExecution();


    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedImage("");
    }, []);
    const computingRef = useRef(false);
    const computeRef = useRef<() => Promise<void>>(async () => { });


    useEffect(() => {
        if (!testData?.data) return;

        setDataBufById((prev) => {
            const next = { ...prev };
            Object.entries(fullById).forEach(([id, full]) => {
                if (!full) return;
                const baseValues = toEditable(full as any).values || {};
                const overrides = testData.data?.[id] || {};
                if (Object.keys(overrides).length) {
                    next[id] = { ...baseValues, ...overrides };
                }
            });
            return next;
        });
    }, [testData, fullById]);


    useEffect(() => {
        if (!idSuite) return;

        let isCancelled = false;
        const controller = new AbortController();

        const fetchSuiteById = async (id: string) => {
            try {
                setIsLoadingSuiteDetails(true);
                setErrorSuite(null);

                const { data: suite } = await axios.post(
                    `${URL_API_ALB}testSuite`,
                    { id },
                    { signal: controller.signal }
                );
                if (isCancelled) return;
                setSuiteDetails(suite as SuiteResponse);

                const arrayItems = (suite?.batchItems?.array ?? []).map(toId).filter(Boolean) as string[];
                if (!arrayItems.length) {
                    setSuiteTests([]);
                    return;
                }

                const results = await Promise.allSettled(
                    arrayItems.map((id) =>
                        axios.post(`${URL_API_ALB}getTestHeaders`, { id }, { signal: controller.signal })
                    )
                );
                if (isCancelled) return;

                const testsWithOrder = results
                    .map((r, idx) => {
                        if (r.status === "fulfilled") {
                            const payload = r.value.data;
                            const testCase = Array.isArray(payload) ? payload[0] : payload;
                            return testCase ? { ...testCase, __order: idx } : null;
                        }
                        return null;
                    })
                    .filter(Boolean) as Array<any & { __order: number }>;

                const seen = new Set<string>();
                const uniqueOrdered: TestHeader[] = [];
                for (const tc of testsWithOrder.sort((a, b) => a.__order - b.__order)) {
                    const idTc = tc?.id ?? tc?.testCaseId;
                    if (!idTc || seen.has(idTc)) continue;
                    seen.add(idTc);
                    const { __order, ...rest } = tc;
                    uniqueOrdered.push(rest);
                }
                setSuiteTests(uniqueOrdered);
            } catch (error: any) {
                if (!isCancelled) setErrorSuite(error?.response?.data?.message || "Failed to load suite");
            } finally {
                if (!isCancelled) setIsLoadingSuiteDetails(false);
            }
        };

        fetchSuiteById(idSuite);

        return () => {
            isCancelled = true;
            controller.abort();
        };
    }, [idSuite]);


    const onViewTest = useCallback(
        async (testId: string) => {
            if (fullById[testId]) {
                setExpanded((prev) => ({ ...prev, [testId]: !prev[testId] }));
                return;
            }
            try {
                setLoadingTest((p) => ({ ...p, [testId]: true }));
                const { data } = await axios.post(`${URL_API_ALB}tests`, { id: testId });
                const payload: FullTest = Array.isArray(data) ? data[0] : data;
                setFullById((prev: any) => ({ ...prev, [testId]: payload }));
                const { values } = toEditable(payload);
                const overrides = (testData?.data ?? {})[testId] || {};
                setDataBufById((prev) => ({ ...prev, [testId]: { ...values, ...overrides } }));
                setStepsBufById((prev) => ({ ...prev, [testId]: [...(payload.stepsData || [])] }));
                setExpanded((prev) => ({ ...prev, [testId]: true }));
            } catch {
                toast.error("Error cargando el test");
            } finally {
                setLoadingTest((p) => ({ ...p, [testId]: false }));
            }
        },
        [fullById]
    );

    const openDataView = useCallback(
        async (testId: string) => {
            if (!fullById[testId]) await onViewTest(testId);
            setShowData((prev) => ({ ...prev, [testId]: true }));
            setShowSteps((prev) => ({ ...prev, [testId]: false }));
            setExpanded((prev) => ({ ...prev, [testId]: true }));
        },
        [fullById, onViewTest]
    );

    const openStepsView = useCallback(
        async (testId: string) => {
            setShowReports((prev) => ({ ...prev, [testId]: false }));

            if (!fullById[testId]) await onViewTest(testId);

            setShowSteps((prev) => ({ ...prev, [testId]: true }));
            setShowData((prev) => ({ ...prev, [testId]: false }));
            setExpanded((prev) => ({ ...prev, [testId]: true }));

        },
        [fullById, onViewTest]
    );

    const buildUpdatePayloadSuite = (
        full: any,
        stepsBuf: any[],
        dataBuf?: Record<string, any>,
        updatedBy = "jpaz"
    ) => {
        const transformedSteps = (stepsBuf ?? []).map((step: any) => {
            if (!step) return step;
            const { stepsId, ...cleanStep } = step;
            if (cleanStep?.stepsData && Array.isArray(cleanStep.stepsData)) {
                return cleanStep.id;
            }
            return cleanStep;
        });

        return {
            id: full.id,
            name: full.name,
            description: full.description,
            groupName: full.groupName,
            moduleName: full.moduleName,
            subModuleName: full.subModuleName,
            tagIds: full.tagIds || [],
            tagNames: full.tagNames || (Array.isArray(full.tagName) ? full.tagName : []),
            contextGeneral: full.contextGeneral,
            testDataObj: dataBuf ?? full.testDataObj ?? {},
            stepsData: transformedSteps,
            updatedBy,
            deleteS3Images: true,
            temp: false,
        };
    };

    const onSave = useCallback(
        async (testId: string) => {
            const full = fullById[testId];
            if (!full) return;
            try {
                setSavingTest((p) => ({ ...p, [testId]: true }));
                const payload = buildUpdatePayloadSuite(
                    full,
                    stepsBufById[testId] || [],
                    dataBufById[testId] || {},
                    "jpaz"
                );
                await updateTest(await payload.id, await payload.stepsData, payload.updatedBy);
                setFullById((prev: any) => ({
                    ...prev,
                    [testId]: {
                        ...full,
                        testDataObj: { ...(payload.testDataObj || {}) },
                        stepsData: [...(stepsBufById[testId] || [])],
                    },
                }));
                toast.success("Changes saved.");
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "Can't save changes.");
            } finally {
                setSavingTest((p) => ({ ...p, [testId]: false }));
            }
        },
        [fullById, stepsBufById, dataBufById]
    );

    const excelFilterOptions = useMemo(() => {
        const tags = new Set<string>();
        const groups = new Set<string>();
        const modules = new Set<string>();
        const submodules = new Set<string>();

        for (const t of suiteTests) {
            (t.tagNames ?? []).forEach((tg) => tg && tags.add(tg));
            if (t.groupName) groups.add(t.groupName);
            if (t.moduleName) modules.add(t.moduleName);
            if (t.subModuleName) submodules.add(t.subModuleName);
        }

        return {
            tags: Array.from(tags).sort(),
            groups: Array.from(groups).sort(),
            modules: Array.from(modules).sort(),
            submodules: Array.from(submodules).sort(),
            statuses: ["passed", "failed", "pending"] as const,
        };
    }, [suiteTests]);

    const filteredSuiteTests = useMemo(() => {
        return suiteTests.filter((t) => {
            const s = (statusById[t.id] ?? "pending") as "passed" | "failed" | "pending";

            const tagOk =
                !filterTag ||
                (Array.isArray(t.tagNames) && t.tagNames.some((tg) => tg === filterTag));

            const groupOk = !filterGroup || t.groupName === filterGroup;
            const moduleOk = !filterModule || t.moduleName === filterModule;
            const submoduleOk = !filterSubmodule || t.subModuleName === filterSubmodule;
            const statusOk = !filterStatus || s === filterStatus;

            return tagOk && groupOk && moduleOk && submoduleOk && statusOk;
        });
    }, [
        suiteTests,
        statusById,
        filterTag,
        filterGroup,
        filterModule,
        filterSubmodule,
        filterStatus,
    ]);


    const handleAddToSuite = useCallback(async () => {
        if (!selectedCaseIdsForAdd.length) {
            toast.error("Select at least one test case");
            return;
        }
        try {
            const currentArray = ((suiteDetails?.batchItems?.array ?? []) as BatchItem[])
                .map(toId)
                .filter(Boolean);

            const currentSet = new Set(currentArray.map(String));
            const toAdd = selectedCaseIdsForAdd.filter(id => !currentSet.has(String(id)));

            if (toAdd.length === 0) {
                toast.message("All selected tests are already in the suite.");
                return;
            }

            const newArray = [...currentArray, ...toAdd].map((id) => ({ id }));
            const newCount = newArray.length;

            await axios.patch(`${URL_API_ALB}testSuite`, {
                id: idSuite,
                batchItems: {
                    count: newCount,
                    array: newArray
                },
                updatedBy: "jpaz"
            });

            setSuiteDetails((prev) =>
                prev ? { ...prev, batchItems: { count: newCount, array: newArray } } : prev
            );

            const addedHeadersRes = await Promise.allSettled(
                toAdd.map((id) => axios.post(`${URL_API_ALB}getTestHeaders`, { id }))
            );

            const addedHeaders: TestHeader[] = [];
            for (const r of addedHeadersRes) {
                if (r.status === "fulfilled") {
                    const d = r.value.data;
                    const item = Array.isArray(d) ? d[0] : d;
                    if (item?.id) addedHeaders.push(item);
                }
            }

            if (addedHeaders.length) {
                setSuiteTests((prev) => {
                    const seen = new Set(prev.map((t) => String(t.id)));
                    const unique = addedHeaders.filter((h) => !seen.has(String(h.id)));
                    return unique.length ? [...prev, ...unique] : prev;
                });
            }

            setOpenAddModal(false);
            setSelectedCaseIdsForAdd([]);
            toast.success(`${toAdd.length} test(s) added to suite`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "Failed to update suite");
        }
    }, [idSuite, suiteDetails?.batchItems?.array, selectedCaseIdsForAdd]);


    const handlePlaySingle = useCallback((test: TestHeader) => {
        const latestPerTestData = getPerTestData(test.id) || {};
        const reportName = `${suiteDetails?.id}-${test.id}`;
        try {
            runSingleTest(test as any, latestPerTestData, isHeadless, reportName);
        } catch (e) {
            console.error(e);
            toast.error("No se pudo ejecutar el test.");
        }
    }, [getPerTestData, runSingleTest, isHeadless, suiteDetails?.name]);

    const fetchHistoricFor = useCallback(
        async (test: TestHeader, opts?: { force?: boolean }) => {
            const testId = String(test.id);
            const meta = historicMetaById[testId];
            const force = !!opts?.force;
            if (!force && meta?.fetched && !meta?.empty) return;

            try {
                setLoadingHistoric(prev => ({ ...prev, [testId]: true }));
                setErrorHistoric(prev => ({ ...prev, [testId]: null }));

                const reportCustomName = buildReportCustomName(suiteDetails, testId);
                const body = { type: "tests-reports", reportCustomName };
                const resp = await axios.post(`${URL_API_ALB}getReports`, body);

                let jsonData: any = null;
                if (resp?.data?.responseSignedUrl) {
                    const url = resp.data.responseSignedUrl as string;
                    const r = await fetch(url, {
                        method: "GET"
                    });
                    const ct = r.headers.get("content-type") || "";
                    jsonData = ct.includes("application/json") ? await r.json() : JSON.parse((await r.text()) || "null");
                } else {
                    jsonData = resp?.data;
                }

                let events: any[] = [];
                let chosenUrl: string | undefined;

                const looksLikeIndexObj =
                    jsonData &&
                    !Array.isArray(jsonData) &&
                    typeof jsonData === "object" &&
                    Object.keys(jsonData).length > 0 &&
                    Array.isArray(jsonData[testId]);

                if (looksLikeIndexObj) {
                    const list = (jsonData[testId] as any[]).slice();

                    const parseTS = (s?: string) => (s ? new Date(s).getTime() : 0);
                    list.sort((a, b) => parseTS(a?.timestamp) - parseTS(b?.timestamp));
                    const latest = list[list.length - 1];

                    chosenUrl = latest?.urlReport;
                    if (chosenUrl) {
                        const r2 = await fetch(chosenUrl, { method: "GET" });
                        const ct2 = r2.headers.get("content-type") || "";
                        const reportJson = ct2.includes("application/json")
                            ? await r2.json()
                            : JSON.parse((await r2.text()) || "null");

                        if (Array.isArray(reportJson)) {
                            for (const rep of reportJson) {
                                if (!rep || isPlainEmptyObject(rep)) continue;
                                const evs = Array.isArray(rep?.events) ? rep.events : [];
                                for (const ev of evs) {
                                    if (!ev || isPlainEmptyObject(ev)) continue;
                                    const idx =
                                        typeof ev?.indexStep === "number" ? ev.indexStep : events.length + 1;
                                    events.push({ ...ev, indexStep: idx });
                                }
                            }
                        } else if (reportJson && typeof reportJson === "object") {
                            if (!isPlainEmptyObject(reportJson)) {
                                const evs = Array.isArray(reportJson?.events) ? reportJson.events : [];
                                for (const ev of evs) {
                                    if (!ev || isPlainEmptyObject(ev)) continue;
                                    const idx =
                                        typeof ev?.indexStep === "number" ? ev.indexStep : events.length + 1;
                                    events.push({ ...ev, indexStep: idx });
                                }
                            }
                        }
                    }
                } else {
                    const arr = Array.isArray(jsonData) ? jsonData : jsonData ? [jsonData] : [];
                    for (const rep of arr) {
                        if (!rep || isPlainEmptyObject(rep)) continue;
                        const evs = Array.isArray(rep?.events) ? rep.events : [];
                        for (const ev of evs) {
                            if (!ev || isPlainEmptyObject(ev)) continue;
                            const idx =
                                typeof ev?.indexStep === "number" ? ev.indexStep : events.length + 1;
                            events.push({ ...ev, indexStep: idx });
                        }
                    }
                }

                const isEmpty =
                    events.length === 0 ||
                    isPlainEmptyObject(jsonData) ||
                    (looksLikeIndexObj && (!chosenUrl || chosenUrl.length === 0));

                setHistoricById(prev => ({ ...prev, [testId]: events }));
                setHistoricMetaById(prev => ({
                    ...prev,
                    [testId]: { fetched: true, empty: isEmpty, lastAt: Date.now(), error: null },
                }));
                if (chosenUrl) {
                    setHistoricUrlById(prev => ({ ...prev, [testId]: chosenUrl }));
                }
            } catch (e: any) {
                const msg = e?.response?.data?.message || "No se pudo cargar el historial";
                setErrorHistoric(prev => ({ ...prev, [testId]: msg }));
                setHistoricById(prev => ({ ...prev, [testId]: [] }));
                setHistoricMetaById(prev => ({
                    ...prev,
                    [testId]: { fetched: true, empty: true, lastAt: Date.now(), error: msg },
                }));
            } finally {
                setLoadingHistoric(prev => ({ ...prev, [testId]: false }));
            }
        },
        [suiteDetails, historicMetaById]
    );


    const handleImageClick = (image: string) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };


    const pickLatestFromIndex = (list?: any[]) => {
        if (!Array.isArray(list) || list.length === 0) return undefined;
        const parseTS = (s?: string) => (s ? new Date(s).getTime() : 0);
        const sorted = list.slice().sort((a, b) => parseTS(a?.timestamp) - parseTS(b?.timestamp));
        return sorted[sorted.length - 1];
    };

    const computeSuiteExecutionSummary = useCallback(async () => {
        console.log("[computeSuiteExecutionSummary] start", { total: suiteTests?.length || 0, suiteId: suiteDetails?.id });
        const t0 = performance.now();
        if (!suiteDetails || !suiteTests?.length) {
            setSuiteSummary({ total: 0, passed: 0, failed: 0, pending: 0 });
            setStatusById({});
            return;
        }

        const total = suiteTests.length;
        let passed = 0;
        let failed = 0;
        const localStatus: Record<string, "passed" | "failed" | "pending"> = {};
        setIsLoadingComputedData(true);
        console.log("[computeSuiteExecutionSummary] fetching reports for", total, "tests");

        await Promise.allSettled(
            suiteTests.map(async (t) => {
                const testId = String(t.id);
                try {
                    const reportCustomName = buildReportCustomName(suiteDetails, testId);
                    const body = { type: "tests-reports", reportCustomName };
                    const resp = await axios.post(`${URL_API_ALB}getReports`, body);

                    let data: any = null;
                    if (resp?.data?.responseSignedUrl) {
                        const url = resp.data.responseSignedUrl as string;
                        const r = await fetch(url, { method: "GET" });
                        const ct = r.headers.get("content-type") || "";
                        data = ct.includes("application/json") ? await r.json() : JSON.parse((await r.text()) || "null");
                    } else {
                        data = resp?.data;
                    }

                    const looksLikeIndex = data && typeof data === "object" && !Array.isArray(data) && Array.isArray(data[testId]);

                    if (looksLikeIndex) {
                        const latest = pickLatestFromIndex(data[testId]);
                        const s = latest?.status?.toLowerCase?.();
                        if (s === "passed") { passed++; localStatus[testId] = "passed"; }
                        else if (s === "failed") { failed++; localStatus[testId] = "failed"; }
                        else { localStatus[testId] = "pending"; }
                    } else {
                        localStatus[testId] = "pending";
                    }
                } catch {
                    localStatus[testId] = "pending";
                }
            })
        );
        console.log("[computeSuiteExecutionSummary] reports fetched, computing summary", { passed, failed });

        const pending = Math.max(0, total - passed - failed);
        setSuiteSummary({ total, passed, failed, pending });

        setStatusById(localStatus);
        setIsLoadingComputedData(false);
        setSummaryTick(t => t + 1);
        console.log("[computeSuiteExecutionSummary] done in", Math.round(performance.now() - t0), "ms",
            { passed, failed, pending });
    }, [suiteDetails, suiteTests, URL_API_ALB]);


    useEffect(() => {
        if (suiteDetails && suiteTests.length) {
            computeSuiteExecutionSummary();
        } else {
            setSuiteSummary({ total: 0, passed: 0, failed: 0, pending: 0 });
            setStatusById({});
        }
    }, [suiteDetails, suiteTests, computeSuiteExecutionSummary]);


    const handleViewReports = useCallback(
        async (test: TestHeader) => {
            const testId = String(test.id);
            setShowReports((prev) => ({ ...prev, [testId]: true }));
            setShowData((prev) => ({ ...prev, [testId]: false }));
            setShowSteps((prev) => ({ ...prev, [testId]: false }));
            setExpanded((prev) => ({ ...prev, [testId]: true }));
            setReportsTabById((prev) => ({ ...prev, [testId]: prev[testId] || "saved" }));

            computeSuiteExecutionSummary();

            fetchHistoricFor(test);
        },
        [fetchHistoricFor, computeSuiteExecutionSummary]
    );

    const openDeleteFor = (id: string) => {
        setToDeleteId(id);
        setOpenDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!toDeleteId || !suiteDetails) {
            setOpenDeleteModal(false);
            setToDeleteId(null);
            return;
        }
        try {
            const currentArray = ((suiteDetails?.batchItems?.array ?? []) as BatchItem[]).map(toId).filter(Boolean);
            const newArray = currentArray.filter((x) => x !== toDeleteId).map((id) => ({ id }));
            const newCount = newArray.length;

            await axios.patch(`${URL_API_ALB}testSuite`, {
                id: idSuite,
                batchItems: { array: newArray },
                updatedBy: "jpaz",
            });

            setSuiteDetails((prev) =>
                prev ? { ...prev, batchItems: { array: newArray } } : prev
            );
            setSuiteTests((prev) => prev.filter((t) => String(t.id) !== String(toDeleteId)));

            setExpanded((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setLoadingTest((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setSavingTest((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setFullById((p: any) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setDataBufById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setStepsBufById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setShowData((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setShowSteps((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setShowReports((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setReportsTabById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setHistoricById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setHistoricMetaById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setHistoricUrlById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
            setStatusById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });

            toast.success("Test case eliminado de la suite");
        } catch (e: any) {
            toast.error(e?.response?.data?.message || "No se pudo eliminar el test de la suite");
        } finally {
            setOpenDeleteModal(false);
            setToDeleteId(null);
            computeSuiteExecutionSummary();
        }
    };

    const progressByTestId = useMemo<Record<string, number>>(() => {
        if (!Array.isArray(progress)) return {};
        const map: Record<string, number> = {};
        for (const p of progress) {
            const pct = Number(p?.percent ?? 0);
            if (p?.testCaseId) map[p.testCaseId] = Number.isFinite(pct) ? pct : 0;
        }
        return map;
    }, [progress]);

    const getProgressForTest = useCallback((testId: string) => {
        return progressByTestId[testId] ?? 0;
    }, [progressByTestId]);




    const handleTestFinalStatus = useCallback(async (_id: string, _final: "completed" | "failed") => {
        try {
            console.log("Test finalizado:", _id, _final);


            if (computingRef.current) {
                queueMicrotask(() => computeRef.current());
                return;
            }
            computingRef.current = true;
            await computeRef.current();
        } catch (e) {
            console.error("computeSuiteExecutionSummary falló:", e);
        } finally {
            computingRef.current = false;
        }
    }, []);

    const getStepSelectionClasses = useCallback(
        (testId: string, idx: number) => {
            const active = !!selectionModeById[testId];
            const list = selectedStepsForReusableById[testId] || [];
            const isSelected = list.includes(idx);
            return [
                "rounded-lg border transition cursor-pointer",
                isDarkMode ? "border-white/10 hover:bg-gray-900/50" : "border-slate-200 hover:bg-slate-50",
                active && (isSelected ? (isDarkMode ? "ring-2 ring-primary-blue/70" : "ring-2 ring-primary/70") : "opacity-90"),
            ].join(" ");
        },
        [isDarkMode, selectionModeById, selectedStepsForReusableById]
    );

    const handleStepSelection = useCallback((testId: string, idx: number) => {
        setSelectedStepsForReusableById(prev => {
            const cur = prev[testId] || [];
            const exists = cur.includes(idx);
            const next = exists ? cur.filter(i => i !== idx) : [...cur, idx];
            next.sort((a, b) => a - b);
            return { ...prev, [testId]: next };
        });
    }, []);

    const setShowReusableModalFor = useCallback((testId: string, open: boolean) => {
        setShowReusableModalById(prev => ({ ...prev, [testId]: open }));
    }, []);

    const toggleSelectionModeFor = useCallback((testId: string) => {
        setSelectionModeById(prev => ({ ...prev, [testId]: !prev[testId] }));
        setSelectedStepsForReusableById(prev => ({ ...prev, [testId]: [] }));
    }, []);

    const handleCreateReusableStep = useCallback((testId: string, selectedIdxs: number[]) => {
        setStepsBufById(prev => {
            const base = [...(prev[testId] || [])];
            const picked = selectedIdxs.map(i => base[i]).filter(Boolean);
            const newReusable = { action: "STEPS-REUSABLE", type: "STEPS-REUSABLE", stepsData: picked };
            const next = [...base, newReusable].map((s: any, i: number) => ({ ...s, indexStep: i + 1 }));
            return { ...prev, [testId]: next };
        });
        setSelectedStepsForReusableById(prev => ({ ...prev, [testId]: [] }));
        setShowReusableModalById(prev => ({ ...prev, [testId]: false }));
    }, [setStepsBufById]);

    const setResponseStepsCompat = useCallback((testId: string, updater: any) => {
        setStepsBufById(prev => {
            const cur = prev[testId] || [];
            const nextObj = typeof updater === "function" ? updater({ stepsData: cur }) : updater;
            const nextSteps = Array.isArray(nextObj?.stepsData) ? nextObj.stepsData : cur;
            return { ...prev, [testId]: nextSteps };
        });
    }, [setStepsBufById]);

    const hasLiveFor = useCallback((testId: any) => {
        const anyReport =
            (Array.isArray(reports) && reports.some((r: any) =>
                String(r?.testCaseId ?? r?.testId ?? r?.id) === String(testId)
            )) ||
            (idReports &&
                ((Array.isArray(idReports) && idReports.includes(testId)) ||
                    (typeof idReports === "object" && !!idReports[testId]))) ||
            (progress && Array.isArray(progress) && progress.some((p: any) => String(p?.testCaseId) === String(testId)));

        return !!anyReport;
    }, [reports, idReports, progress]);


    const { surface, strongText, softText, tableBorder, tableHeaderBg, rowHover } =
        getUiThemeClasses(isDarkMode);


    return (
        <DashboardHeader onDarkModeChange={setIsDarkMode} hiddenSide={openAddModal || openDeleteModal || isModalOpen}>
            <div className="flex flex-col items-center w-full">
                <button className="self-start">
                    <Link href="/testSuites" className={
                        isDarkMode
                            ? "text-white/80 hover:text-white flex items-center mb-4"
                            : "text-primary/80 hover:text-primary flex items-center mb-4"
                    }>
                        <ArrowLeft className="mr-2" /> Back to Test Suites
                    </Link>
                </button>

                {isLoadingSuiteDetails && (
                    <LoadingSkeleton darkMode={isDarkMode} />
                )}
                {errorSuite && !isLoadingSuiteDetails && (
                    <p className={isDarkMode ? "text-red-300" : "text-red-600"}>{errorSuite}</p>
                )}

                {suiteDetails && !isLoadingSuiteDetails && (
                    <div className={`w-full mt-6 p-4 rounded-md ${surface}`}>
                        <DetailSuite
                            suiteDetails={suiteDetails}
                            isDarkMode={isDarkMode}
                            editingTitle={editingTitle}
                            setEditingTitle={setEditingTitle}
                            titleDraft={titleDraft}
                            setTitleDraft={setTitleDraft}
                            commitTitle={commitTitle}
                            editingDesc={editingDesc}
                            setEditingDesc={setEditingDesc}
                            descDraft={descDraft}
                            setDescDraft={setDescDraft}
                            commitDesc={commitDesc}
                            savingMeta={savingMeta}
                            isLoadingComputedData={isLoadingComputedData}
                            computeSuiteExecutionSummary={computeSuiteExecutionSummary}
                            dynamicDataHeaders={dynamicDataHeaders}
                            selectedDynamicDataId={selectedDynamicDataId}
                            setSelectedDynamicDataId={setSelectedDynamicDataId}
                            ddCount={ddCount}

                        />

                        {suiteSummary.failed === 0 && suiteSummary.passed === 0 && suiteSummary.pending === 0 ? (
                            <div className={`h-48 flex items-center justify-center border rounded-md mt-6 ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                                <p className={softText}>No execution data available for this suite.</p>
                            </div>
                        ) : (
                            <ExecutionSummary
                                key={summaryTick}
                                totalFailed={suiteSummary.failed}
                                totalSuccess={suiteSummary.passed}
                                totalPending={suiteSummary.pending}
                                darkMode={isDarkMode} />
                        )}

                        {suiteTests.length > 0 && (
                            <div className="mt-6 flex flex-col w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-semibold ${strongText}`}>Test Cases in this Suite</h3>

                                </div>

                                <FilterTable
                                    isDarkMode={isDarkMode}
                                    filterTag={filterTag}
                                    setFilterTag={setFilterTag}
                                    filterGroup={filterGroup}
                                    setFilterGroup={setFilterGroup}
                                    filterModule={filterModule}
                                    setFilterModule={setFilterModule}
                                    filterSubmodule={filterSubmodule}
                                    setFilterSubmodule={setFilterSubmodule}
                                    filterStatus={filterStatus}
                                    excelFilterOptions={excelFilterOptions}
                                    setFilterStatus={setFilterStatus} />

                                <div className={`mt-3 overflow-x-auto min-h-[400px] rounded-lg border ${tableBorder}`}>
                                    <table className="min-w-full text-sm">
                                        <thead className={tableHeaderBg}>
                                            <tr className={`text-left ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Name</th>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Description</th>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Tags</th>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Group</th>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Module</th>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Submodule</th>
                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Status</th>

                                                <th className={`px-4 py-3 font-semibold border-b ${tableBorder}`}>Actions</th>
                                            </tr>

                                        </thead>


                                        <tbody key={suiteDetails?.id} className={`${isDarkMode ? "divide-y-2 divide-white/90" : "divide-y divide-gray-200"} max-h-[900px]`}>
                                            {filteredSuiteTests.map((test) => {
                                                const testId = test.id;
                                                const isOpen = !!expanded[testId];
                                                const isLoading = !!loading[testId];
                                                const isSaving = !!savingTest[testId];
                                                const full = fullById[testId];
                                                const showD = !!showData[testId];
                                                const showS = !!showSteps[testId];
                                                const showR = !!showReports[testId];

                                                const computedTestDataFor = {
                                                    data: {
                                                        ...(testData?.data ?? {}),
                                                        [testId]: (dataBufById[testId] ?? (testData?.data?.[testId] ?? {})),
                                                    }
                                                };
                                                const pForThisTest = getProgressForTest(testId);
                                                const isRunningNow = pForThisTest > 0 && pForThisTest < 100;

                                                return (
                                                    <Fragment key={testId}>

                                                        <RowTable
                                                            test={test}
                                                            testId={testId}
                                                            statusById={statusById}
                                                            isRunningNow={isRunningNow}
                                                            pForThisTest={pForThisTest}
                                                            isDarkMode={isDarkMode}
                                                            loading={loading}
                                                            showD={showD}
                                                            showS={showS}
                                                            showR={showR}
                                                            handleViewReports={handleViewReports}
                                                            handlePlaySingle={handlePlaySingle}
                                                            openDataView={openDataView}
                                                            openStepsView={openStepsView}
                                                            openDeleteFor={openDeleteFor}
                                                            isLoading={isLoading}
                                                            isSaving={isSaving}
                                                            rowHover={rowHover}
                                                            strongText={strongText}
                                                            softText={softText} />

                                                        {isOpen && (showD || showS || showReports[testId]) && (
                                                            <tr>
                                                                <td colSpan={8} className={`px-6 pb-6 ${isDarkMode ? "bg-gray-900/40" : "bg-gray-50"}`}>
                                                                    {full && (
                                                                        <div className="mt-3 space-y-3">
                                                                            <div className="flex items-center gap-2">
                                                                                {(showS || showD) && (
                                                                                    <div className="ml-auto flex items-center gap-2 w-full justify-between">
                                                                                        {showS && (
                                                                                            <button
                                                                                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded font-semibold ${isDarkMode ? "bg-primary-blue/80 text-white" : "bg-primary text-white"}`}
                                                                                                onClick={() => onSave(testId)}
                                                                                                disabled={isSaving}
                                                                                            >
                                                                                                <Save className="w-4 h-4" /> Save
                                                                                            </button>
                                                                                        )}

                                                                                        {showD && (
                                                                                            <div></div>
                                                                                        )}
                                                                                        <button
                                                                                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-300 hover:bg-gray-100"}`}
                                                                                            onClick={() => {
                                                                                                setShowData((prev) => ({ ...prev, [testId]: false }));
                                                                                                setShowSteps((prev) => ({ ...prev, [testId]: false }));
                                                                                                setShowReports((prev) => ({ ...prev, [testId]: false }));
                                                                                            }}
                                                                                        >
                                                                                            <X className="w-4 h-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {showD && (

                                                                                <ShowData

                                                                                    isDarkMode={isDarkMode}
                                                                                    testId={testId}
                                                                                    test={test}
                                                                                    full={full}
                                                                                    dataBufById={dataBufById}
                                                                                    setDataBufById={setDataBufById}
                                                                                    handleSaveDynamicData={handleSaveDynamicData}
                                                                                    savingDDById={savingDDById} />

                                                                            )}

                                                                            {showS && (

                                                                                <ShowSteps
                                                                                    isDarkMode={isDarkMode}
                                                                                    testId={testId}
                                                                                    full={full}
                                                                                    stepsBufById={stepsBufById}
                                                                                    setStepsBufById={setStepsBufById}
                                                                                    selectionModeById={selectionModeById}
                                                                                    toggleSelectionModeFor={toggleSelectionModeFor}
                                                                                    selectedStepsForReusableById={selectedStepsForReusableById}
                                                                                    setSelectedStepsForReusableById={setSelectedStepsForReusableById}
                                                                                    showReusableModalById={showReusableModalById}
                                                                                    setShowReusableModalFor={setShowReusableModalFor}
                                                                                    handleCreateReusableStep={handleCreateReusableStep}
                                                                                    setResponseStepsCompat={setResponseStepsCompat}
                                                                                    transformedStepsToCopy={transformedStepsToCopy}
                                                                                    getStepSelectionClasses={getStepSelectionClasses}
                                                                                    handleStepSelection={handleStepSelection} />
                                                                            )}


                                                                        </div>
                                                                    )}


                                                                    {showR && (

                                                                        <ShowReport
                                                                            isDarkMode={isDarkMode}
                                                                            testId={testId}
                                                                            showReports={showReports}
                                                                            setShowReports={setShowReports}
                                                                            showSteps={showSteps}
                                                                            setShowSteps={setShowSteps}
                                                                            showData={showData}
                                                                            setShowData={setShowData}
                                                                            historicById={historicById}
                                                                            historicMetaById={historicMetaById}
                                                                            fetchHistoricFor={fetchHistoricFor}
                                                                            suiteTests={suiteTests}
                                                                            test={test}
                                                                            computedTestDataFor={computedTestDataFor}
                                                                            reports={reports}
                                                                            idReports={idReports}
                                                                            progress={progress}
                                                                            loadingHistoric={loadingHistoric}
                                                                            errorHistoric={errorHistoric}
                                                                            handlePlaySingle={handlePlaySingle}
                                                                            handleTestFinalStatus={handleTestFinalStatus}
                                                                            stopped={stopped}
                                                                            setStopped={setStopped}
                                                                            setLoading={setLoading}
                                                                            loading={loading}
                                                                            handleImageClick={handleImageClick}
                                                                            stopAll={stopAll}
                                                                            hasLiveFor={hasLiveFor}
                                                                            reportsTabById={reportsTabById}
                                                                            setReportsTabById={setReportsTabById} />
                                                                    )}

                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <button
                                        onClick={() => setOpenAddModal(true)}
                                        className={`mt-4 mb-2 px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"}`}
                                    >
                                        <PlusIcon className="w-5 h-5 mr-2 inline-block" /> Add Test Case
                                    </button>
                                </div>

                                <div className={`mt-3 text-xs ${softText}`}>
                                    Showing {filteredSuiteTests.length} of {suiteTests.length} test{filteredSuiteTests.length !== 1 ? "s" : ""}
                                </div>
                            </div>
                        )}
                        {suiteTests.length === 0 && (
                            <div className="mt-6">
                                <NoData text="No test cases in this suite yet." darkMode={isDarkMode} />
                                <div className="flex justify-center mt-4">
                                    <button
                                        onClick={() => setOpenAddModal(true)}
                                        className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"}`}
                                    >
                                        <PlusIcon className="w-5 h-5 mr-2 inline-block" /> Add Test Case
                                    </button>

                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalDeleteTest
                openDeleteModal={openDeleteModal}
                setOpenDeleteModal={setOpenDeleteModal}
                toDeleteId={toDeleteId as string}
                confirmDelete={confirmDelete}
                isDarkMode={isDarkMode}
            />

            <ModalAddSuite
                openAddModal={openAddModal}
                setOpenAddModal={setOpenAddModal}
                isDarkMode={isDarkMode}
                isLoadingTags={isLoadingTags}
                tags={tags}
                isLoadingGroups={isLoadingGroups}
                groups={groups}
                isLoadingModules={isLoadingModules}
                modules={modules}
                isLoadingSubmodules={isLoadingSubmodules}
                submodules={submodules}
                loadingUsers={loadingUsers}
                userOptions={userOptions}
                handleSearchModal={handleSearchModal}
                isSearchingTC={isSearchingTC}
                searchResults={searchResults}
                selectedCaseIdsForAdd={selectedCaseIdsForAdd}
                toggleSelectResult={toggleSelectResult}
                allVisibleSelected={allVisibleSelected}
                someVisibleSelected={someVisibleSelected}
                toggleAllVisible={toggleAllVisible}
                handleAddToSuite={handleAddToSuite}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                selectedModule={selectedModule}
                setSelectedModule={setSelectedModule}
                selectedSubmodule={selectedSubmodule}
                setSelectedSubmodule={setSelectedSubmodule}
                selectedCreatedBy={selectedCreatedBy}
                setSelectedCreatedBy={setSelectedCreatedBy}
                searchTestCaseName={searchTestCaseName}
                setSearchTestCaseName={setSearchTestCaseName}
                searchTestCaseId={searchTestCaseId}
                setSearchTestCaseId={setSearchTestCaseId}
                setSelectedCaseIdsForAdd={setSelectedCaseIdsForAdd}
            />

            {isModalOpen && (
                <ImageModalWithZoom isOpen={isModalOpen} imageUrl={selectedImage} onClose={handleCloseModal} />
            )}

        </DashboardHeader>
    );
};

export default TestSuiteId;
