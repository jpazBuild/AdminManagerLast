"use client";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import axios from "axios";
import { ArrowLeft, Database, Eye, PlayIcon, Save, X, Loader2, PlusIcon, Check, File, Trash2, Settings, RefreshCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback, Fragment, useRef } from "react";
import UnifiedInput from "@/app/components/Unified";
import InteractionItem from "@/app/components/Interaction";
import { toast } from "sonner";
import { updateTest } from "@/utils/DBBUtils";
import { ExecutionSummary } from "@/app/components/ExecutionSummary";
import { SearchField } from "@/app/components/SearchField";
import ModalCustom from "@/app/components/ModalCustom";
import TextInputWithClearButton from "@/app/components/InputClear";
import { useTestExecution } from "@/app/hooks/useTestExecution";
import TestReports from "@/app/dashboard/components/TestReports";
import StepCard from "@/app/components/StepCard";
import { ImageModalWithZoom } from "@/app/components/Report";
import NoData from "@/app/components/NoData";
import ReusableStepModal from "@/app/dashboard/components/ReusableStepModal";
import StepActions from "@/app/components/StepActions";
import CopyToClipboard from "@/app/components/CopyToClipboard";
import LoadingSkeleton from "@/app/components/loadingSkeleton";
import Link from "next/link";

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

const fmtDate = (ts?: number | string) => {
    if (!ts) return "";
    const n = typeof ts === "string" ? Number(ts) : ts;
    if (!Number.isFinite(n)) return "";
    try {
        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(n);
    } catch {
        return "";
    }
};

const toEditable = (t: FullTest) => {
    const keys = Array.isArray(t.testData) ? t.testData : Object.keys(t.testDataObj || {});
    const values: Record<string, any> = { ...(t.testDataObj || {}) };
    keys.forEach((k) => (values[k] = values[k] ?? ""));
    return { keys, values };
};

const slug = (s?: string) =>
    (s || "")
        .toString()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();

const ActiveDot = ({ on, isDark }: { on: boolean; isDark: boolean }) =>
    on ? (
        <span
            className={[
                "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                "ring-2",
                isDark ? "bg-emerald-400 ring-gray-900" : "bg-emerald-500 ring-white",
            ].join(" ")}
        />
    ) : null;

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

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [loadingTest, setLoadingTest] = useState<Record<string, boolean>>({});
    const [savingTest, setSavingTest] = useState<Record<string, boolean>>({});
    const [fullById, setFullById] = useState<Record<string, FullTest | null>>({});
    const [dataBufById, setDataBufById] = useState<Record<string, Record<string, any>>>({});
    const [stepsBufById, setStepsBufById] = useState<Record<string, Step[]>>({});
    const [showData, setShowData] = useState<Record<string, boolean>>({});
    const [showSteps, setShowSteps] = useState<Record<string, boolean>>({});
    const [dynamicDataHeaders, setDynamicDataHeaders] = useState<Array<any>>([]);
    const [selectedDynamicDataId, setSelectedDynamicDataId] = useState<string>("");
    const surface = isDarkMode
        ? "bg-gray-800 border border-gray-700 text-white"
        : "bg-white border border-gray-200 text-primary";
    const strongText = isDarkMode ? "text-white/90" : "text-primary";
    const softText = isDarkMode ? "text-white/80" : "text-primary/80";
    const tableBorder = isDarkMode ? "border-gray-700" : "border-gray-200";
    const tableHeaderBg = isDarkMode ? "bg-gray-900" : "bg-gray-100";
    const rowHover = isDarkMode ? "hover:bg-gray-900/60" : "hover:bg-gray-50";
    const chip = (variant: "a" | "b" | "c") =>
        variant === "a"
            ? isDarkMode
                ? "text-xs bg-gray-900 text-white px-2 py-1 rounded-md"
                : "text-xs bg-primary/70 text-white px-2 py-1 rounded-md"
            : variant === "b"
                ? isDarkMode
                    ? "text-xs bg-gray-700 text-white px-2 py-1 rounded-md"
                    : "text-xs bg-primary/50 text-white px-2 py-1 rounded-md"
                : isDarkMode
                    ? "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md"
                    : "text-xs bg-primary/20 text-primary px-2 py-1 rounded-md";

    const [openAddModal, setOpenAddModal] = useState(false);

    const [tags, setTags] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [submodules, setSubmodules] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [selectedTag, setSelectedTag] = useState<string>("");
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [selectedModule, setSelectedModule] = useState<string>("");
    const [selectedSubmodule, setSelectedSubmodule] = useState<string>("");
    const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>("");

    const [searchTestCaseName, setSearchTestCaseName] = useState<string>("");
    const [searchTestCaseId, setSearchTestCaseId] = useState<string>("");

    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingModules, setIsLoadingModules] = useState(false);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isSearchingTC, setIsSearchingTC] = useState(false);

    const [searchResults, setSearchResults] = useState<TestHeader[]>([]);
    const [selectedCaseIdsForAdd, setSelectedCaseIdsForAdd] = useState<string[]>([]);

    const getSelectedTagId = useCallback(() => {
        if (!selectedTag) return "";
        const tag: any = tags.find((t: any) => t.name === selectedTag);
        return tag ? tag.id : selectedTag;
    }, [selectedTag, tags]);

    const getSelectedGroupId = useCallback(() => {
        if (!selectedGroup) return "";
        const group: any = groups.find((g: any) => g.name === selectedGroup);
        return group ? group.id : selectedGroup;
    }, [selectedGroup, groups]);

    const getSelectedModuleId = useCallback(() => {
        if (!selectedModule) return "";
        const mod: any = modules.find((m: any) => m.name === selectedModule);
        return mod ? mod.id : selectedModule;
    }, [selectedModule, modules]);

    const getSelectedSubmoduleId = useCallback(() => {
        if (!selectedSubmodule) return "";
        const sub: any = submodules.find((s: any) => s.name === selectedSubmodule);
        return sub ? sub.id : selectedSubmodule;
    }, [selectedSubmodule, submodules]);

    const toggleSelectResult = useCallback((id: string) => {
        setSelectedCaseIdsForAdd(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const [isHeadless, setIsHeadless] = useState<boolean>(true);

    const [testData, setTestData] = useState<{ data?: Record<string, Record<string, any>> }>({});

    const [ddCount, setDdCount] = useState<number>(0);


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
    const [savingDDById, setSavingDDById] = useState<Record<string, boolean>>({});

    const [filterTag, setFilterTag] = useState<string>("");
    const [filterGroup, setFilterGroup] = useState<string>("");
    const [filterModule, setFilterModule] = useState<string>("");
    const [filterSubmodule, setFilterSubmodule] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<"" | "passed" | "failed" | "pending">("");
    const [selectionModeById, setSelectionModeById] = useState<Record<string, boolean>>({});
    const [isLoadingComputedData, setIsLoadingComputedData] = useState<boolean>(false);
    const [selectedStepsForReusableById, setSelectedStepsForReusableById] = useState<Record<string, number[]>>({});
    const [showReusableModalById, setShowReusableModalById] = useState<Record<string, boolean>>({});
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
        const loadDD = async () => {
            if (!selectedDynamicDataId) {
                setTestData({});
                setDdCount(0);
                return;
            }
            try {
                const res = await axios.post(`${URL_API_ALB}dynamicData`, { id: selectedDynamicDataId });
                const arr = res?.data?.dynamicData;
                if (!Array.isArray(arr)) {
                    toast.error("Dynamic data invalid.");
                    setTestData({});
                    setDdCount(0);
                    return;
                }
                const byId: Record<string, Record<string, any>> = {};
                for (const it of arr) {
                    if (it?.id && it?.input && typeof it.input === "object") {
                        byId[String(it.id)] = it.input;
                    }
                }
                setTestData({ data: byId });
                setDdCount(Object.keys(byId).length);
                toast.success(`Dynamic Data loaded (${Object.keys(byId).length} inputs).`);
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "Can't load Dynamic Data.");
                setTestData({});
                setDdCount(0);
            }
        };
        loadDD();
    }, [selectedDynamicDataId]);

    useEffect(() => {
        if (!openAddModal) return;

        (async () => {
            try {
                setIsLoadingTags(true);
                const tagsRes = await axios.post(`${URL_API_ALB}tags`, {});
                setTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);
            } catch {
                setTags([]);
            } finally {
                setIsLoadingTags(false);
            }

            try {
                setLoadingUsers(true);
                const usersRes = await axios.post(`${URL_API_ALB}users`, {});
                setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            } catch {
                setUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        })();
    }, [openAddModal]);

    useEffect(() => {
        if (!openAddModal) return;
        (async () => {
            try {
                setIsLoadingGroups(true);
                const tagId = getSelectedTagId();
                const res = await axios.post(`${URL_API_ALB}groups`, {});
                setGroups(Array.isArray(res.data) ? res.data : []);
            } catch {
                setGroups([]);
            } finally {
                setIsLoadingGroups(false);
            }
        })();
    }, [openAddModal, selectedTag, getSelectedTagId]);

    useEffect(() => {
        if (!openAddModal) return;
        (async () => {
            if (!selectedGroup) {
                setModules([]); setSelectedModule("");
                setSubmodules([]); setSelectedSubmodule("");
                return;
            }
            try {
                setIsLoadingModules(true);
                const groupId = getSelectedGroupId();
                const res = await axios.post(`${URL_API_ALB}modules`, { groupId });
                setModules(Array.isArray(res.data) ? res.data : []);
            } catch {
                setModules([]);
            } finally {
                setIsLoadingModules(false);
            }
        })();
    }, [openAddModal, selectedGroup, getSelectedGroupId]);

    useEffect(() => {
        if (!openAddModal) return;
        (async () => {
            if (!selectedGroup || !selectedModule) {
                setSubmodules([]); setSelectedSubmodule("");
                return;
            }
            try {
                setIsLoadingSubmodules(true);
                const groupId = getSelectedGroupId();
                const moduleId = getSelectedModuleId();
                const res = await axios.post(`${URL_API_ALB}subModules`, { groupId, moduleId });
                setSubmodules(Array.isArray(res.data) ? res.data : []);
            } catch {
                setSubmodules([]);
            } finally {
                setIsLoadingSubmodules(false);
            }
        })();
    }, [openAddModal, selectedGroup, selectedModule, getSelectedGroupId, getSelectedModuleId]);

    useEffect(() => {
        if (!testData?.data) return;

        setDataBufById((prev) => {
            const next = { ...prev };
            Object.entries(fullById).forEach(([id, full]) => {
                if (!full) return;
                const baseValues = toEditable(full).values || {};
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

    const fetchEnvironments = useCallback(async () => {
        try {
            const list = await axios.post(`${URL_API_ALB}getDynamicDataHeaders`, {});
            setDynamicDataHeaders(list?.data);

        } catch {
            return [];
        }
    }, []);

    useEffect(() => {
        fetchEnvironments();
    }, [fetchEnvironments]);



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
                setFullById((prev) => ({ ...prev, [testId]: payload }));
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
                setFullById((prev) => ({
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

    const batchArray = useMemo(
        () =>
            (suiteDetails?.batchItems?.array ?? [])
                .map(toId)
                .filter((x): x is string => typeof x === "string" && x.length > 0),
        [suiteDetails?.batchItems?.array]
    );

    const userOptions = useMemo(
        () => (users || []).map((u: any) => ({ label: u.name, value: u.name })),
        [users]
    );



    const getUserIdByName = useCallback(
        (name: string) => {
            const user = users.find((u: any) => u.name === name);
            return user ? user.id : null;
        },
        [users]
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

    const handleSearchModal = useCallback(async () => {
        try {
            setIsSearchingTC(true);
            const params: Record<string, any> = {};
            const tagId = getSelectedTagId();
            const groupId = getSelectedGroupId();
            const moduleId = getSelectedModuleId();
            const submoduleId = getSelectedSubmoduleId();

            if (searchTestCaseId) params.id = searchTestCaseId;
            if (tagId) params.tagIds = [tagId];
            if (groupId) params.groupId = groupId;
            if (moduleId) params.moduleId = moduleId;
            if (submoduleId) params.subModuleId = submoduleId;
            if (searchTestCaseName) params.partialName = searchTestCaseName;
            if (selectedCreatedBy) params.createdBy = getUserIdByName(selectedCreatedBy);

            const response = await axios.post(`${URL_API_ALB}getTestHeaders`, params);

            if (response?.data?.responseSignedUrl) {
                const url = response.data.responseSignedUrl as string;
                const res = await fetch(url, { method: "GET" });
                const contentType = res.headers.get("content-type") || "";
                const jsonData = contentType.includes("application/json")
                    ? await res.json()
                    : JSON.parse((await res.text()) || "null");
                setSearchResults(Array.isArray(jsonData) ? jsonData : []);
            } else {
                setSearchResults(Array.isArray(response.data) ? response.data : []);
            }
        } catch (e) {
            toast.error("Error fetching test cases");
            setSearchResults([]);
        } finally {
            setIsSearchingTC(false);
        }
    }, [
        searchTestCaseId, searchTestCaseName, selectedCreatedBy,
        getSelectedTagId, getSelectedGroupId, getSelectedModuleId, getSelectedSubmoduleId, getUserIdByName
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
                const resp = await axios.post(`${URL_API_ALB}getReports`, body, { headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } });

                let jsonData: any = null;
                if (resp?.data?.responseSignedUrl) {
                    const url = resp.data.responseSignedUrl as string;
                    const r = await fetch(url, {
                        method: "GET",
                        cache: "no-store",
                        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
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
        computeRef.current = computeSuiteExecutionSummary;
    }, [computeSuiteExecutionSummary]);

    useEffect(() => {
        if (suiteDetails && suiteTests.length) {
            computeSuiteExecutionSummary();
        }
    }, [reports, progress, idReports]);

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
            setFullById((p) => { const n = { ...p }; delete n[toDeleteId]; return n; });
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


    const handleSaveDynamicData = useCallback(
        async (testId: string, test?: TestHeader) => {
            if (!selectedDynamicDataId) {
                toast.error("Select a Dynamic Data set first.");
                return;
            }

            try {
                setSavingDDById(prev => ({ ...prev, [testId]: true }));

                const getRes = await axios.post(`${URL_API_ALB}dynamicData`, { id: selectedDynamicDataId });
                const current = getRes?.data;

                const ddHeader = {
                    id: current?.id ?? selectedDynamicDataId,
                    groupName: current?.groupName ?? undefined,
                    name: current?.name ?? undefined,
                    description: current?.description ?? undefined,
                    tagIds: current?.tagIds ?? [],
                    tagNames: current?.tagNames ?? [],
                    dynamicData: Array.isArray(current?.dynamicData) ? current.dynamicData.slice() : [],
                    updatedBy: current?.createdByName ?? "jpaz",
                };

                const latestInput = (dataBufById?.[testId]) ? { ...dataBufById[testId] } : {};

                const idx = ddHeader.dynamicData.findIndex((it: any) => String(it?.id) === String(testId));
                if (idx >= 0) {
                    ddHeader.dynamicData[idx] = {
                        ...ddHeader.dynamicData[idx],
                        id: testId,
                        input: latestInput,
                        testCaseName: ddHeader.dynamicData[idx]?.testCaseName ?? test?.name ?? undefined,
                        createdBy: ddHeader.dynamicData[idx]?.createdBy ?? "jpaz",
                    };
                } else {
                    ddHeader.dynamicData.push({
                        id: testId,
                        input: latestInput,
                        order: ddHeader.dynamicData.length,
                        testCaseName: test?.name ?? "",
                        createdBy: ddHeader?.updatedBy ?? "jpaz",
                    });
                }

                await axios.patch(`${URL_API_ALB}dynamicData`, ddHeader);

                toast.success("Dynamic Data guardado.");

                try {
                    const res = await axios.post(`${URL_API_ALB}dynamicData`, { id: selectedDynamicDataId });
                    const arr = res?.data?.dynamicData;
                    const byId: Record<string, Record<string, any>> = {};
                    if (Array.isArray(arr)) {
                        for (const it of arr) {
                            if (it?.id && it?.input && typeof it.input === "object") {
                                byId[String(it.id)] = it.input;
                            }
                        }
                    }
                    setTestData({ data: byId });
                    setDdCount(Object.keys(byId).length);

                    setDataBufById(prev => ({ ...prev, [testId]: latestInput }));
                } catch {
                    toast.error("Cant refresh Dynamic Data after save.");
                }
            } catch (e: any) {
                toast.error(e?.response?.data?.message || "Can't save Dynamic Data.");
            } finally {
                setSavingDDById(prev => ({ ...prev, [testId]: false }));
            }
        },
        [selectedDynamicDataId, dataBufById, URL_API_ALB]
    );

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
                        <div className="flex items-center justify-between w-full">
                            <h2 className={`text-2xl font-bold ${strongText}`}>{suiteDetails.name}</h2>
                            <button className={`${isLoadingComputedData ? "animate-spin" : ""}`} onClick={computeSuiteExecutionSummary}>
                                <RefreshCcw className="w-5 h-5" size={20} />
                            </button>

                        </div>
                        {suiteDetails.description && <p className={`mt-2 ${softText}`}>{suiteDetails.description}</p>}

                        <div className="mt-3 flex flex-wrap gap-2 items-center mb-4">
                            {suiteDetails.tagNames?.map((t) => (
                                <span key={t} className={chip("a")}>
                                    {t}
                                </span>
                            ))}
                            {suiteDetails.createdByName && <span className={chip("b")}>By: {suiteDetails.createdByName}</span>}
                            {suiteDetails.createdAt && <span className={chip("b")}>{fmtDate(suiteDetails.createdAt)}</span>}
                        </div>
                        <div className="flex self-end w-full justify-end mb-4">
                            <div className="flex items-center gap-3">
                                <SearchField
                                    label="Dynamic Data"
                                    darkMode={isDarkMode}
                                    placeholder=""
                                    onChange={setSelectedDynamicDataId}
                                    value={selectedDynamicDataId}
                                    options={dynamicDataHeaders.map((env: any) => ({ label: env.name, value: env.id }))}
                                    customDarkColor="bg-gray-900/60"
                                    className="!w-90 self-end"
                                    widthComponent="w-90"
                                />
                                {selectedDynamicDataId && (
                                    <span className={`text-xs ${softText}`}>
                                        {ddCount} assigned inputs
                                    </span>
                                )}
                            </div>
                        </div>


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
                                darkMode={isDarkMode}
                            />
                        )}

                        {suiteTests.length > 0 && (
                            <div className="mt-6 flex flex-col w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-semibold ${strongText}`}>Test Cases in this Suite</h3>

                                </div>

                                <div
                                    className={[
                                        "sticky top-0 z-20",
                                        "w-full",
                                        isDarkMode ? "bg-gray-900/95 backdrop-blur border-y border-gray-800" : "bg-white/95 backdrop-blur border-y border-gray-200",
                                    ].join(" ")}
                                >
                                    <div className="px-4 py-3">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <h4 className={isDarkMode ? "text-white/80 text-sm font-semibold" : "text-primary/80 text-sm font-semibold"}>
                                                Filters
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                {(filterTag || filterGroup || filterModule || filterSubmodule || filterStatus) && (
                                                    <span className={isDarkMode ? "text-xs text-white/50" : "text-xs text-primary/60"}>
                                                        Active: {[
                                                            filterTag && `Tag: ${filterTag}`,
                                                            filterGroup && `Group: ${filterGroup}`,
                                                            filterModule && `Module: ${filterModule}`,
                                                            filterSubmodule && `Submodule: ${filterSubmodule}`,
                                                            filterStatus && `Status: ${String(filterStatus).charAt(0).toUpperCase() + String(filterStatus).slice(1)}`,
                                                        ].filter(Boolean).join(" • ")}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setFilterTag("");
                                                        setFilterGroup("");
                                                        setFilterModule("");
                                                        setFilterSubmodule("");
                                                        setFilterStatus("");
                                                    }}
                                                    className={[
                                                        "px-3 py-1.5 rounded-md text-xs font-medium",
                                                        isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-primary",
                                                        "transition"
                                                    ].join(" ")}
                                                    title="Reset filters"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                                            <div className="relative">
                                                <SearchField
                                                    darkMode={isDarkMode}
                                                    placeholder="Filter by tag"
                                                    onChange={(val: any) => setFilterTag(val)}
                                                    value={filterTag}
                                                    options={excelFilterOptions.tags.map((t) => ({ label: t, value: t }))}
                                                    customDarkColor="bg-gray-800"
                                                    className="!w-full !h-10"
                                                    widthComponent="w-full"
                                                />
                                            </div>

                                            <div className="relative">
                                                <SearchField
                                                    darkMode={isDarkMode}
                                                    placeholder="Group"
                                                    onChange={(val: any) => setFilterGroup(val)}
                                                    value={filterGroup}
                                                    options={excelFilterOptions.groups.map((g) => ({ label: g, value: g }))}
                                                    customDarkColor="bg-gray-800"
                                                    className="!w-full !h-10"
                                                    widthComponent="w-full"
                                                />
                                            </div>

                                            <div className="relative">
                                                <SearchField
                                                    darkMode={isDarkMode}
                                                    placeholder="Filter by module"
                                                    onChange={(val: any) => setFilterModule(val)}
                                                    value={filterModule}
                                                    options={excelFilterOptions.modules.map((m) => ({ label: m, value: m }))}
                                                    customDarkColor="bg-gray-800"
                                                    className="!w-full !h-10"
                                                    widthComponent="w-full"
                                                />
                                            </div>

                                            <div className="relative">
                                                <SearchField
                                                    darkMode={isDarkMode}
                                                    placeholder="Filter by submodule"
                                                    onChange={(val: any) => setFilterSubmodule(val)}
                                                    value={filterSubmodule}
                                                    options={excelFilterOptions.submodules.map((s) => ({ label: s, value: s }))}
                                                    customDarkColor="bg-gray-800"
                                                    className="!w-full !h-10"
                                                    widthComponent="w-full"
                                                />
                                            </div>

                                            <div className="relative">
                                                <SearchField
                                                    darkMode={isDarkMode}
                                                    placeholder="Filter by status"
                                                    onChange={(val: any) => setFilterStatus(val)}
                                                    value={filterStatus}
                                                    options={excelFilterOptions.statuses.map((s) => ({
                                                        label: s.charAt(0).toUpperCase() + s.slice(1),
                                                        value: s
                                                    }))}
                                                    customDarkColor="bg-gray-800"
                                                    className="!w-full !h-10"
                                                    widthComponent="w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                                const isLoading = !!loadingTest[testId];
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
                                                        <tr key={test.id} className={`${rowHover} ${isDarkMode ? "border-gray-800" : "border-gray-600 bg-gray-200"}`}>
                                                            <td className={`px-4 py-3 align-top ${strongText}`}>
                                                                <div className="font-medium">{test.name || "Unnamed Test Case"}</div>
                                                                <div className={`text-xs ${softText}`}>ID: {test.id}</div>
                                                            </td>

                                                            <td className={`px-4 py-3 align-top ${softText}`}>
                                                                {test.description ? test.description : <span className="opacity-60">—</span>}
                                                            </td>

                                                            <td className="px-4 py-3 align-top">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Array.isArray(test.tagNames) && test.tagNames.length > 0 ? (
                                                                        test.tagNames.map((tag) => (
                                                                            <span key={tag} className={chip("a")}>
                                                                                {tag}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        <span className={`text-xs ${softText} opacity-70`}>—</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-3 align-top">
                                                                {test.groupName ? (
                                                                    <span className={chip("b")}>{test.groupName}</span>
                                                                ) : (
                                                                    <span className={`text-xs ${softText} opacity-70`}>—</span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 align-top">
                                                                {test.moduleName ? (
                                                                    <span className={chip("b")}>{test.moduleName}</span>
                                                                ) : (
                                                                    <span className={`text-xs ${softText} opacity-70`}>—</span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 align-top">
                                                                {test.subModuleName ? (
                                                                    <span className={chip("b")}>{test.subModuleName}</span>
                                                                ) : (
                                                                    <span className={`text-xs ${softText} opacity-70`}>—</span>
                                                                )}
                                                            </td>

                                                            <td className="px-4 py-3 align-top">
                                                                {(() => {
                                                                    const s = statusById[testId] || "pending";
                                                                    const label = s.charAt(0).toUpperCase() + s.slice(1);
                                                                    const style =
                                                                        s === "passed"
                                                                            ? (isDarkMode ? "bg-green-700 text-white" : "bg-green-100 text-green-700")
                                                                            : s === "failed"
                                                                                ? (isDarkMode ? "bg-red-700 text-white" : "bg-red-100 text-red-700")
                                                                                : (isDarkMode ? "bg-yellow-800 text-white" : "bg-yellow-100 text-yellow-700");
                                                                    return <span className={`text-xs px-2 py-1 rounded-md font-medium ${style}`}>{label}</span>;
                                                                })()}
                                                            </td>

                                                            <td className="px-4 py-3 align-top">
                                                                <div className="flex items-center gap-2">
                                                                    {/* Run */}
                                                                    <button
                                                                        title={isRunningNow ? `Running... ${pForThisTest}%` : "Run"}
                                                                        className={[
                                                                            "relative cursor-pointer rounded-md p-2 border transition",
                                                                            isDarkMode
                                                                                ? "border-gray-700 hover:bg-primary-blue/70 bg-primary-blue/60"
                                                                                : "border-gray-200 hover:bg-primary/90 text-white bg-primary/70",
                                                                        ].join(" ")}
                                                                        onClick={() => handlePlaySingle(test)}
                                                                        disabled={isRunningNow || isLoading || isSaving}
                                                                    >
                                                                        {!stopped?.[testId] && isRunningNow ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                                        ) : (
                                                                            <PlayIcon className="w-4 h-4 text-white" />
                                                                        )}
                                                                    </button>

                                                                    <button
                                                                        title="Data"
                                                                        className={[
                                                                            "relative cursor-pointer rounded-md p-2 border transition",
                                                                            isDarkMode
                                                                                ? showD
                                                                                    ? "border-emerald-400 bg-gray-900"
                                                                                    : "border-gray-700 hover:bg-gray-900"
                                                                                : showD
                                                                                    ? "border-emerald-500 bg-gray-100"
                                                                                    : "border-gray-200 hover:bg-gray-50",
                                                                        ].join(" ")}
                                                                        onClick={() => openDataView(testId)}
                                                                        disabled={isLoading || isSaving}
                                                                    >
                                                                        <Database className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
                                                                        <ActiveDot on={showD} isDark={isDarkMode} />
                                                                    </button>

                                                                    <button
                                                                        title="Steps"
                                                                        className={[
                                                                            "relative cursor-pointer rounded-md p-2 border transition",
                                                                            isDarkMode
                                                                                ? showS
                                                                                    ? "border-emerald-400 bg-gray-900"
                                                                                    : "border-gray-700 hover:bg-gray-900"
                                                                                : showS
                                                                                    ? "border-emerald-500 bg-gray-100"
                                                                                    : "border-gray-200 hover:bg-gray-50",
                                                                        ].join(" ")}
                                                                        onClick={() => openStepsView(testId)}
                                                                        disabled={isLoading || isSaving}
                                                                    >
                                                                        <Eye className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
                                                                        <ActiveDot on={showS} isDark={isDarkMode} />
                                                                    </button>

                                                                    <button
                                                                        className={[
                                                                            "relative cursor-pointer rounded-md p-2 border transition",
                                                                            isDarkMode
                                                                                ? showR
                                                                                    ? "border-emerald-400 bg-gray-900"
                                                                                    : "border-gray-700 hover:bg-gray-900"
                                                                                : showR
                                                                                    ? "border-emerald-500 bg-gray-100"
                                                                                    : "border-gray-200 hover:bg-gray-50",
                                                                        ].join(" ")}
                                                                        title="View Reports"
                                                                        onClick={() => handleViewReports(test)}
                                                                    >
                                                                        <File className={isDarkMode ? "w-4 h-4 text-white" : "w-4 h-4 text-primary"} />
                                                                        <ActiveDot on={showR} isDark={isDarkMode} />
                                                                    </button>

                                                                    <button
                                                                        className={`cursor-pointer rounded-md p-2 border transition ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-200 hover:bg-gray-50"
                                                                            }`}
                                                                        title="Delete from Suite"
                                                                        onClick={() => openDeleteFor(testId)}
                                                                    >
                                                                        <Trash2 className={isDarkMode ? "text-white w-4 h-4" : "text-primary w-4 h-4"} />
                                                                    </button>
                                                                </div>

                                                                <div className="mt-2 text-xs min-h-5">
                                                                    {isLoading && (
                                                                        <span className={softText}>
                                                                            <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" /> Loading test…
                                                                        </span>
                                                                    )}
                                                                    {isSaving && (
                                                                        <span className={softText}>
                                                                            <Loader2 className="inline-block w-3 h-3 mr-1 animate-spin" /> Saving…
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                        </tr>

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
                                                                                <div className="w-full">
                                                                                    <h3 className={`${isDarkMode ? "text-white/70" : "text-primary/70"} text-center mb-2 font-semibold text-lg`}>Dynamic Data</h3>
                                                                                    <div className={`rounded-md border p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>

                                                                                        {(() => {
                                                                                            const { keys } = toEditable(full);
                                                                                            const values = dataBufById[testId] || {};
                                                                                            return keys.map((k) => (
                                                                                                <div key={k} className="flex flex-col gap-6">
                                                                                                    <UnifiedInput
                                                                                                        id={`${testId}-${k}`}
                                                                                                        value={values[k] ?? ""}
                                                                                                        placeholder={`Enter ${k}`}
                                                                                                        label={`Enter ${k}`}
                                                                                                        isDarkMode={isDarkMode}
                                                                                                        enableFaker
                                                                                                        onChange={(val) =>
                                                                                                            setDataBufById((prev) => ({
                                                                                                                ...prev,
                                                                                                                [testId]: { ...(prev[testId] || {}), [k]: val },
                                                                                                            }))
                                                                                                        }
                                                                                                    />
                                                                                                </div>
                                                                                            ));
                                                                                        })()}


                                                                                    </div>
                                                                                    <div className="flex justify-end mt-4">
                                                                                        <button
                                                                                            onClick={() => handleSaveDynamicData(testId, test)}
                                                                                            disabled={!!savingDDById[testId]}
                                                                                            className={`px-4 py-2 flex items-center font-semibold gap-2 cursor-pointer rounded-md text-white ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80" : "hover:bg-primary/85 bg-primary/80"}`}
                                                                                        >
                                                                                            {savingDDById[testId] ? (
                                                                                                <>
                                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                                    Guardando...
                                                                                                </>
                                                                                            ) : (
                                                                                                <>Save</>
                                                                                            )}
                                                                                        </button>
                                                                                    </div>


                                                                                </div>

                                                                            )}

                                                                            {showS && (
                                                                                <div className="rounded-md p-3 space-y-3 max-h-[800px] overflow-y-auto">
                                                                                    <div className={[
                                                                                        "sticky top-0 z-10 px-2 py-2",
                                                                                        isDarkMode ? "bg-gray-900/80 backdrop-blur border-b border-white/10" : "bg-white/80 backdrop-blur border-b border-slate-200"
                                                                                    ].join(" ")}>
                                                                                        <div className="flex flex-wrap items-center gap-4 justify-between">
                                                                                            <div className="flex items-center gap-2 font-semibold">
                                                                                                <button
                                                                                                    onClick={() => toggleSelectionModeFor(testId)}
                                                                                                    className={[
                                                                                                        "border shadow-md cursor-pointer flex items-center px-4 py-1.5 rounded-md",
                                                                                                        isDarkMode ? "bg-gray-800 text-white border-white/40" : "bg-gray-200 text-gray-900 border-primary/40",
                                                                                                    ].join(" ")}
                                                                                                >
                                                                                                    <Settings className="w-4 h-4 mr-1" />
                                                                                                    {selectionModeById[testId] ? "Cancel Selection" : "Select Steps for Reusable"}
                                                                                                </button>

                                                                                                {selectionModeById[testId] && (selectedStepsForReusableById[testId]?.length || 0) > 0 && (
                                                                                                    <button
                                                                                                        onClick={() => setShowReusableModalFor(testId, true)}
                                                                                                        className={`${isDarkMode ? "bg-primary-blue/60" : "bg-primary/90"} px-4 py-1.5 text-white cursor-pointer flex items-center rounded-md`}
                                                                                                    >
                                                                                                        <PlusIcon className="w-4 h-4 mr-1" />
                                                                                                        Create Reusable ({selectedStepsForReusableById[testId]?.length || 0})
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>

                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={[
                                                                                                    "rounded-md flex items-center gap-2 border-dashed border p-1",
                                                                                                    isDarkMode ? "border-gray-600 text-white" : "border-primary/40 text-primary/90",
                                                                                                ].join(" ")}>
                                                                                                    <span>Copy All steps</span>
                                                                                                    <CopyToClipboard
                                                                                                        text={JSON.stringify(transformedStepsToCopy(stepsBufById[testId] || []), null, 2)}
                                                                                                        isDarkMode={isDarkMode}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {(stepsBufById[testId] || []).map((step, i) => (
                                                                                        <div key={i} className="flex flex-col gap-2">
                                                                                            <div
                                                                                                className={getStepSelectionClasses(testId, i)}
                                                                                                onClick={() => selectionModeById[testId] && handleStepSelection(testId, i)}
                                                                                            >
                                                                                                <InteractionItem
                                                                                                    data={{ id: `${testId}-step-${i}`, ...step }}
                                                                                                    index={i}
                                                                                                    isDarkMode={isDarkMode}
                                                                                                    test={full as any}
                                                                                                    setTestCasesData={() => { }}
                                                                                                    setResponseTest={() => { }}
                                                                                                    onUpdate={(idx, newStep) => {
                                                                                                        setStepsBufById(prev => {
                                                                                                            const arr = [...(prev[testId] || [])];
                                                                                                            if (newStep?.type?.startsWith?.("STEPS") && Array.isArray(newStep?.stepsData)) {
                                                                                                                arr[idx] = { ...newStep };
                                                                                                            } else {
                                                                                                                arr[idx] = { ...arr[idx], ...newStep };
                                                                                                            }
                                                                                                            const next = arr.map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
                                                                                                            return { ...prev, [testId]: next };
                                                                                                        });
                                                                                                    }}
                                                                                                    onDelete={(idx) => {
                                                                                                        setStepsBufById(prev => {
                                                                                                            const next = (prev[testId] || [])
                                                                                                                .filter((_, j) => j !== idx)
                                                                                                                .map((s: any, k: number) => ({ ...s, indexStep: k + 1 }));
                                                                                                            setSelectedStepsForReusableById(selPrev => {
                                                                                                                const cur = selPrev[testId] || [];
                                                                                                                const fixed = cur
                                                                                                                    .filter(n => n !== idx)
                                                                                                                    .map(n => (n > idx ? n - 1 : n));
                                                                                                                return { ...selPrev, [testId]: fixed };
                                                                                                            });
                                                                                                            return { ...prev, [testId]: next };
                                                                                                        });
                                                                                                    }}
                                                                                                />
                                                                                            </div>

                                                                                            <StepActions
                                                                                                index={i}
                                                                                                steps={stepsBufById[testId] || []}
                                                                                                test={{ ...(full || {}), id: testId }}
                                                                                                setTestCasesData={() => { }}
                                                                                                setResponseTest={(updater: any) => setResponseStepsCompat(testId, updater)}
                                                                                                darkMode={isDarkMode}
                                                                                            />
                                                                                        </div>
                                                                                    ))}

                                                                                    <ReusableStepModal
                                                                                        isOpen={!!showReusableModalById[testId]}
                                                                                        onClose={() => setShowReusableModalFor(testId, false)}
                                                                                        selectedSteps={selectedStepsForReusableById[testId] || []}
                                                                                        steps={stepsBufById[testId] || []}
                                                                                        onCreateReusable={(payload: { selectedIndexes?: number[] }) => {
                                                                                            handleCreateReusableStep(testId, payload?.selectedIndexes || (selectedStepsForReusableById[testId] || []));
                                                                                        }}
                                                                                        isDarkMode={isDarkMode}
                                                                                        responseTest={{ stepsData: stepsBufById[testId] || [] }}
                                                                                        onSetResponseData={(next: any) =>
                                                                                            setStepsBufById(prev => ({ ...prev, [testId]: Array.isArray(next?.stepsData) ? next.stepsData : (prev[testId] || []) }))
                                                                                        }

                                                                                    />
                                                                                </div>
                                                                            )}


                                                                        </div>
                                                                    )}


                                                                    {showR && (
                                                                        <div className={`rounded-md border p-3 space-y-3 mt-4 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                                                                            <h3 className={`${isDarkMode ? "text-white/70" : "text-primary/70"} text-center mb-2 font-semibold text-lg`}></h3>

                                                                            <div className="flex gap-2 justify-between items-center">
                                                                                <div className="flex gap-2">
                                                                                    {hasLiveFor(testId) && (
                                                                                        <button
                                                                                            className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${(reportsTabById[testId] ?? "live") === "live"
                                                                                                ? (isDarkMode ? "bg-primary-blue/70 text-white border-transparent" : "bg-primary text-white border-primary")
                                                                                                : (isDarkMode ? "border-white/15 text-white/80" : "border-slate-300 text-primary/70")}`}
                                                                                            onClick={() => setReportsTabById(prev => ({ ...prev, [testId]: "live" }))}
                                                                                        >
                                                                                            Live
                                                                                        </button>
                                                                                    )}

                                                                                    <button
                                                                                        className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${(reportsTabById[testId] ?? (hasLiveFor(testId) ? "live" : "saved")) === "saved"
                                                                                            ? (isDarkMode ? "bg-primary-blue/70 text-white border-transparent" : "bg-primary text-white border-primary")
                                                                                            : (isDarkMode ? "border-white/15 text-white/80" : "border-slate-300 text-primary/70")}`}
                                                                                        onClick={() => {
                                                                                            setReportsTabById((prev) => ({ ...prev, [testId]: "saved" }));
                                                                                            const meta = historicMetaById[testId];
                                                                                            if (!meta?.fetched || meta?.empty) {
                                                                                                const t = suiteTests.find((x) => String(x.id) === testId);
                                                                                                if (t) fetchHistoricFor(t, { force: true });
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        Saved
                                                                                    </button>
                                                                                </div>

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

                                                                            {(() => {
                                                                                const activeTab = reportsTabById[testId] ?? (hasLiveFor(testId) ? "live" : "saved");
                                                                                if (activeTab === "live" && hasLiveFor(testId)) {
                                                                                    return (
                                                                                        <TestReports
                                                                                            stopped={stopped}
                                                                                            setStopped={setStopped}
                                                                                            setLoading={setLoading}
                                                                                            loading={loading}
                                                                                            testData={computedTestDataFor}
                                                                                            reports={reports}
                                                                                            idReports={idReports}
                                                                                            progress={progress}
                                                                                            selectedCases={[test]}
                                                                                            selectedTest={[test]}
                                                                                            darkMode={isDarkMode}
                                                                                            onPlayTest={handlePlaySingle}
                                                                                            stopAll={stopAll}
                                                                                            showOnlySingletest={true}
                                                                                            onFinalStatus={handleTestFinalStatus}
                                                                                        />
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <div className="space-y-3">
                                                                                        {loadingHistoric[testId] && (
                                                                                            <LoadingSkeleton darkMode={isDarkMode} />
                                                                                        )}
                                                                                        {!!errorHistoric[testId] && (
                                                                                            <div className={isDarkMode ? "text-red-300" : "text-red-600"}>{errorHistoric[testId]}</div>
                                                                                        )}
                                                                                        {!loadingHistoric[testId] && !errorHistoric[testId] && (
                                                                                            (() => {
                                                                                                const evs = (historicById[testId] || []).slice().sort((a, b) => (a.indexStep ?? 0) - (b.indexStep ?? 0));
                                                                                                if (evs.length === 0) {
                                                                                                    return <NoData darkMode={isDarkMode} text="No historical reports found for this test." />;
                                                                                                }
                                                                                                return (
                                                                                                    <div className={`rounded-md border ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                                                                                                        <div className={isDarkMode ? "bg-gray-900/40 p-2" : "bg-slate-50 p-2"}>
                                                                                                            <div className="text-lg opacity-80 text-center">Report</div>
                                                                                                        </div>
                                                                                                        <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2 px-4">
                                                                                                            {evs.map((e, i) => (
                                                                                                                <StepCard
                                                                                                                    key={i}
                                                                                                                    step={e}
                                                                                                                    index={e.indexStep || i + 1}
                                                                                                                    darkMode={isDarkMode}
                                                                                                                    stepData={e.stepData}
                                                                                                                    handleImageClick={() => handleImageClick(e?.screenshot)}
                                                                                                                />
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })()
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
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
                                        className={`mt-4 mb-2 px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
                                            }`}
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
                                        className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
                                            }`}
                                    >
                                        <PlusIcon className="w-5 h-5 mr-2 inline-block" /> Add Test Case
                                    </button>

                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ModalCustom
                open={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
                isDarkMode={isDarkMode}
                width="max-w-md"
            >
                <div className={`p-4 ${isDarkMode ? "text-white" : "text-primary"}`}>
                    <h3 className="text-lg font-semibold mb-2">Remove test from suite</h3>
                    <p className="mb-4 text-sm opacity-80">
                        Are you sure you want to remove <span className="font-medium">{toDeleteId}</span> from this suite?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            className={`px-4 py-2 rounded-md border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                            onClick={() => setOpenDeleteModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-red-700 hover:bg-red-800 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                            onClick={confirmDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </ModalCustom>

            <ModalCustom
                open={openAddModal}
                onClose={() => setOpenAddModal(false)}
                isDarkMode={isDarkMode}
                width="max-w-3xl"
            >
                <div className={`max-h-[90vh] p-4 ${isDarkMode ? "text-white" : "text-primary"}`}>
                    <h3 className="text-lg font-semibold mb-3">Add Test Case to Suite</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {isLoadingTags ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Tags"
                                value={selectedTag}
                                onChange={setSelectedTag}
                                options={tags.map((t: any) => ({ label: t.name, value: t.name }))}
                                darkMode={isDarkMode}
                                className="w-full"
                            />
                        )}

                        {isLoadingGroups ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Groups"
                                value={selectedGroup}
                                onChange={setSelectedGroup}
                                options={groups.map((g: any) => ({ label: g.name, value: g.name }))}
                                darkMode={isDarkMode}
                                className="w-full"
                                disabled={groups.length === 0}
                            />
                        )}

                        {isLoadingModules ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Modules"
                                value={selectedModule}
                                onChange={setSelectedModule}
                                options={modules.map((m: any) => ({ label: m.name, value: m.name }))}
                                darkMode={isDarkMode}
                                className="w-full"
                                disabled={!selectedGroup || modules.length === 0}
                            />
                        )}

                        {isLoadingSubmodules ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Submodules"
                                value={selectedSubmodule}
                                onChange={setSelectedSubmodule}
                                options={submodules.map((s: any) => ({ label: s.name, value: s.id }))}
                                darkMode={isDarkMode}
                                className="w-full"
                                disabled={!selectedModule || submodules.length === 0}
                            />
                        )}

                        {loadingUsers ? (
                            <div className={`h-10 rounded-md animate-pulse ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        ) : (
                            <SearchField
                                label="Created by"
                                value={selectedCreatedBy}
                                onChange={setSelectedCreatedBy}
                                options={userOptions}
                                darkMode={isDarkMode}
                                className="w-full"
                            />
                        )}
                        <TextInputWithClearButton
                            id="modal-search-name"
                            label="Name"
                            value={searchTestCaseName}
                            onChangeHandler={(e) => setSearchTestCaseName(e.target.value)}
                            placeholder="Search by name..."
                            className="w-full"
                            isSearch
                            isDarkMode={isDarkMode}
                        />

                        <TextInputWithClearButton
                            id="modal-search-id"
                            label="Test Case ID"
                            value={searchTestCaseId}
                            onChangeHandler={(e) => setSearchTestCaseId(e.target.value)}
                            placeholder="Search by id..."
                            className="w-full"
                            isSearch
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
                                }`}
                            onClick={handleSearchModal}
                            disabled={isSearchingTC}
                        >
                            {isSearchingTC ? "Searching..." : "Search"}
                        </button>

                        <button
                            className={`px-4 py-2 rounded-md border ${isDarkMode ? "border-gray-600" : "border-gray-300"
                                }`}
                            onClick={() => {
                                setSelectedTag(""); setSelectedGroup(""); setSelectedModule("");
                                setSelectedSubmodule(""); setSelectedCreatedBy("");
                                setSearchTestCaseName(""); setSearchTestCaseId("");
                                setSelectedCaseIdsForAdd([]);

                            }}
                        >
                            Clear
                        </button>
                    </div>

                    <div className="mt-4 max-h-[45vh] overflow-y-auto rounded-md p-2">
                        {searchResults.length === 0 ? (
                            <NoData text="No test cases found." darkMode={isDarkMode} />
                        ) : (
                            <ul className="space-y-2">
                                {searchResults.map((r) => (
                                    <li
                                        key={r.id}
                                        onClick={() => toggleSelectResult(r.id)}
                                        className={[
                                            "p-2 rounded-md cursor-pointer transition",
                                            isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "hover:bg-gray-100",
                                            selectedCaseIdsForAdd.includes(r.id)
                                                ? (isDarkMode ? "ring-1 ring-primary-blue/60 bg-gray-700" : "ring-1 ring-primary/40 bg-gray-100")
                                                : ""
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedCaseIdsForAdd.includes(r.id)}
                                                onChange={() => toggleSelectResult(r.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`mt-1 ${isDarkMode ? "accent-primary-blue" : "accent-primary"} h-4 w-4`}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{r.name || "Unnamed"}</div>
                                                <div className="text-xs opacity-75">ID: {r.id}</div>
                                                {Array.isArray(r.tagNames) && r.tagNames.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {r.tagNames.map((t) => (
                                                            <span key={t} className={`text-[10px] ${isDarkMode ? "bg-gray-600" : "bg-primary/20 text-primary"} px-2 py-0.5 rounded`}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {selectedCaseIdsForAdd.includes(r.id) && (
                                                    <div className={`mt-2 text-sm font-bold ${isDarkMode ? "text-white" : "text-primary"}`}>
                                                        <Check className="w-4 h-4 inline-block mr-1" /> Selected
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>

                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            className={`px-4 py-2 rounded-md border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                            onClick={() => setOpenAddModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md font-semibold ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80 text-white" : "bg-primary/90 hover:bg-primary/85 text-white"
                                }`}
                            onClick={handleAddToSuite}
                            disabled={selectedCaseIdsForAdd.length === 0}
                        >
                            Add {selectedCaseIdsForAdd.length > 0 ? `(${selectedCaseIdsForAdd.length})` : ""} to Suite
                        </button>
                    </div>
                </div>
            </ModalCustom>

            {isModalOpen && (
                <ImageModalWithZoom isOpen={isModalOpen} imageUrl={selectedImage} onClose={handleCloseModal} />
            )}

        </DashboardHeader>
    );
};

export default TestSuiteId;
