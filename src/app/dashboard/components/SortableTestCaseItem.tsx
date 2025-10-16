import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Eye, File, FileChartColumn, Locate, Plus, Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import CopyToClipboard from "../../components/CopyToClipboard";
import StepActions from "../../components/StepActions";
import InteractionItem from "../../components/Interaction";
import { toast } from "sonner";
import { handleAxiosRequest } from "@/utils/handleAxiosRequest";
import axios from "axios";
import { TestCase } from "@/types/TestCase";
import ReusableStepModal from "./ReusableStepModal";
import { URL_API_ALB } from "@/config";
import TestCaseActions from "./TestCaseActions";
import ReportTestCaseList from "./ReportsHistoricTestCaseList";
import UnifiedInput from "../../components/Unified";
import { updateTest } from "@/utils/DBBUtils";
import EditLocationPanel from "./EditLocationPanel";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ButtonTab from "@/app/components/ButtonTab";

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

type Row = {
    id: string;
    order?: number;
    createdByName?: string;
    input: Record<string, any>;
    originalExpressions?: Record<string, string>;
    OriginalExpression?: Record<string, string>;
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
    handleValueChange: (field: string, value: string, id: string, originalExpression?: string) => void;
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
    const [openModal, setOpenModal] = useState(false);
    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [jsonValue, setJsonValue] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);

    const fakerExprByFieldRef = useRef<Record<string, string>>({});
    const keyFor = (testId: string, field: string) => `${testId}::${field}`;
    const [isLoadingTest, setIsLoadingTest] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

    const isOpen = useMemo(() => openItems.includes(test.id ?? ''), [openItems, test.id]);
    const testId = useMemo(() => test.id ?? '', [test.id]);

    const [openDialogDelete, setOpenDialogDelete] = useState(true);
    const [openDialogUpdate, setOpenDialogUpdate] = useState(true);

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

        const apiUrl = (URL_API_ALB ?? '');
        console.log("responseTest?.id para deleteTest:", await test?.id);
        const id = await test?.id;
        const res = await handleAxiosRequest(() =>
            axios.delete(`${apiUrl}tests`, {
                data: { id },
            }),
            "Test case deleted successfully"
        );

        if (res) {
            setTestCasesData(prev => prev.filter(tc => tc.id !== test.id));
            setDynamicValues(prev => prev.filter(val => val.id !== test.id));
            onRefreshAfterUpdateOrDelete();
        }
        await setOpenDialogDelete(false);
    }, [test?.id, setTestCasesData, setDynamicValues, onRefreshAfterUpdateOrDelete]);

    const handleToggleSelect = useCallback(() => {
        toggleSelect(testId);

        // setOpenItems((prev) => {
        //     if (!prev.includes(testId)) {
        //         return [...prev, testId];
        //     }
        //     return prev;
        // });
    }, [toggleSelect, testId]);

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
            ? "w-full shadow-xl p-2 rounded-md border-l-4 border-2 border-slate-400 bg-gray-800 text-white"
            : "w-full h-full shadow-xl rounded-md border-1 border-primary/60 bg-gray-50",
        header: isDarkMode
            ? "flex items-center w-full bg-gray-700/50 p-0.5 rounded"
            : "flex items-center w-full bg-transparent p-0.5",
        idContainer: isDarkMode
            ? "flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-gray-500"
            : "flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20",
        idText: isDarkMode
            ? "text-xs font-mono text-gray-400"
            : "text-xs tracking-wider",
        createdBy: isDarkMode
            ? "text-xs text-white/70 px-2 py-1 rounded-md shadow-md bg-gray-700"
            : "text-xs text-primary/80",
        title: isDarkMode
            ? "font-medium mt-2 px-2 break-words text-white"
            : "font-medium mt-2 px-2 break-words text-[##64748B] text-[14px]",
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
            : "flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 mt-4 p-2 overflow-x-hidden",
        stepsScrollContainer: isDarkMode
            ? "flex flex-col gap-4 max-h-[100vh] overflow-y-auto px-1 bg-gray-800"
            : "flex flex-col gap-4 h-full w-full overflow-y-auto px-1 py-2",
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
                opacity === '65' ? 'bg-primary/60' :
                    'bg-slate-600'
                }`;
        } else {
            return `text-xs bg-[#021d3d]/${opacity} text-white px-2 py-1 rounded-full`;
        }
    }, [isDarkMode]);

    const getViewModeButtonClasses = useCallback((mode: string) => {
        const isActive = viewMode === mode;
        return isDarkMode
            ? `rounded-md flex gap-2 p-2 cursor-pointer items-center shadow-md transition-colors ${isActive
                ? 'bg-slate-400 text-white border-b-4 border-slate-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`
            : `rounded-md flex gap-2 p-2 cursor-pointer bg-primary/5 items-center text-primary/70 ${isActive ? 'border-b-4 border-primary' : 'hover:bg-gray-50'
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


    const buildMetaUpdatePayload = (t: any, updatedBy: string) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        groupName: t.groupName,
        moduleName: t.moduleName,
        subModuleName: t.subModuleName,
        tagIds: t.tagIds || [],
        tagNames: t.tagNames || (Array.isArray(t.tagName) ? t.tagName : []),
        contextGeneral: t.contextGeneral,
        updatedBy,
        deleteS3Images: true,
        temp: false,
    });

    const buildAppendPayload = (testCaseId: string, stepsBatch: any[], updatedBy: string) => ({
        id: testCaseId,
        stepsData: stepsBatch,
        updatedBy,
    });

    const transformedStepsToCopy = (stepsData: any[]) => {
        return stepsData.map((step: any) => {
            if (!step) return step;

            const { stepsId, ...cleanStep } = step;

            if (cleanStep?.stepsData && Array.isArray(cleanStep.stepsData)) {
                return cleanStep.id;
            }

            return cleanStep;
        });
    }
    const buildUpdatePayload = useCallback(async (responseTest: any, updatedBy: string) => {
        const seenIds = new Set<string>();

        console.log("responseTest para updateTest:", await responseTest);

        const transformedSteps = await responseTest?.stepsData.map((step: any) => {
            if (!step) return step;

            const { stepsId, ...cleanStep } = step;

            if (cleanStep?.stepsData && Array.isArray(cleanStep.stepsData)) {
                return cleanStep.id;
            }

            return cleanStep;
        });

        console.log("updateTest []:", await transformedSteps);

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
            stepsData: await transformedSteps,
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
        console.log("updateTest testCasesData:", testCasesData);

        console.log("handleUpdateConfirm responseTest:", await responseTest);

        const payload = await buildUpdatePayload(await responseTest, "jpaz");
        console.log("Payload final para updateTest:", payload);

        try {
            setIsLoadingUpdate(true);
            console.log("updateTest payload:", payload);

            const res = await updateTest(await payload.id, await payload.stepsData, payload.updatedBy);
            toast.success("Test updated successfully");
            await fetchTestData(flatReusableSteps);
        } catch (error: any) {
            toast.error("Failed to update test case", error);
        } finally {
            setIsLoadingUpdate(false);
        }
        setOpenDialogUpdate(false);
    }, [buildUpdatePayload, responseTest]);

    const uniqueFields = useMemo(() => Array.from(new Set(testFields)), [testFields]);


    console.log("Rendering SortableTestCaseItem for test:", test);

    const allStepsWithReusableIds = useMemo(() => {
        if (!responseTest?.stepsData) return '';

        const stepsTextArray = responseTest.stepsData.map((step: any) => {

        });

        return stepsTextArray.join('\n');
    }, [responseTest?.stepsData]);

    const toInputWithOriginalExpressions = (row: Row) => {
        if (!row) return null;

        const input = row.input ?? {};
        const exprs = row.originalExpressions ?? row.OriginalExpression ?? {};

        const replacedInput = Object.entries(input).reduce<Record<string, any>>(
            (acc, [key, val]) => {
                acc[key] = key in exprs ? exprs[key] : val;
                return acc;
            },
            {}
        );

        return {
            id: row.id,
            input: replacedInput,
            order: row.order,
            createdByName: row.createdByName,
        };
    };

    const dynamicValueForThisTest = useMemo(() => {
        const row = dynamicValues.find((v: any) => v.id === test.id);
        if (!row) return null;
        return toInputWithOriginalExpressions(row);
    }, [dynamicValues, test.id]);



    return (
        <div className={styleClasses.mainContainer}>

            <AccordionItem value={(test?.testCaseId || test?.id) ?? ''} className="rounded-lg px-2 w-full h-full">
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

                            <div className="flex items-center">

                            </div>
                            <div className="flex justify-between gap-2">


                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-2 flex-wrap max-w-[80%]">
                                        <h3 className="break-words pl-2 line-clamp-6 font-medium">{test.testCaseName || test.name}</h3>
                                        <CopyToClipboard text={test.testCaseName || test.name} isDarkMode={isDarkMode} />
                                    </div>
                                    <span className={styleClasses.createdBy}>
                                        {test.createdByName || test.createdBy || 'Unknown User'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between pl-2 gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={styleClasses.idText}>
                                        Id: {test.testCaseId || test.id}
                                    </span>
                                    {(test.testCaseId || test.id) && <CopyToClipboard text={String(test.testCaseId || test.id)} isDarkMode={isDarkMode} />}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[14px]">
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
                            </div>

                            <div className={styleClasses.stepsInfo}>
                                <span></span>

                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 px-2">
                                {test?.tagNames && test.tagNames.length > 0 && (
                                    (Array.isArray(test.tagNames) ? test.tagNames : [test.tagNames]).map((tag, idx) => (
                                        tag && (
                                            <span key={idx} className={`bg-primary/85 text-xs text-white px-2 py-1 rounded-full`}>
                                                {tag.trim()}
                                            </span>
                                        )
                                    ))
                                )}
                                {test?.groupName && (
                                    <span className={`bg-primary/70 text-xs text-white px-2 py-1 rounded-full`}>
                                        {test?.groupName}
                                    </span>
                                )}
                                {test?.moduleName && (
                                    <span className={`bg-primary/50 text-xs text-white px-2 py-1 rounded-full`}>
                                        {test?.moduleName}
                                    </span>
                                )}
                                {test?.subModuleName && (
                                    <span className={`bg-primary/30 text-xs text-white px-2 py-1 rounded-full`}>
                                        {test.subModuleName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                </div>

                <Dialog
                    open={isOpen}

                >
                    <DialogContent className="w-full h-full max-h-[90vh] min-h-[70vh] overflow-hidden bg-white flex flex-col">
                        <div className="h-full w-full rounded-lg shadow-2xl flex flex-col z-10">

                            <div className="sticky top-0 flex flex-col items-center justify-between px-6 py-4 w-full h-auto bg-white z-50 border-b border-gray-200 rounded-t-lg flex-shrink-0">
                                <div className="flex items-center gap-4 justify-between w-full">
                                    <h2 className="text-lg font-semibold text-primary/80">Test Case Details</h2>
                                    <Button
                                        variant="ghost"
                                        onClick={handleAccordionToggle}
                                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                                    >
                                        <AiOutlineClose className="h-6 w-6" />
                                    </Button>
                                </div>

                                <h3 className="text-lg text-center font-semibold text-primary/80 break-words">{test?.name}</h3>

                            </div>

                            <div className="sticky top-0 gap-2 mb-4 flex-shrink-0 w-full flex justify-center ">
                                {['data', 'steps', 'Historic reports', 'editLocation'].map(mode => (
                                    <ButtonTab
                                        value={mode}
                                        key={mode}
                                        isActive={viewMode === mode}
                                        onClick={() => setViewMode(mode as any)}
                                        Icon={mode === 'editLocation' ? <Locate className="ml-1 h-5 w-5" /> :
                                            mode === 'data' ? <File className="ml-1 h-5 w-5" /> :
                                                mode === 'Historic reports' ? <FileChartColumn className="h-5 w-5" /> :
                                                    <Eye className="ml-1 h-5 w-5" />}
                                        label={mode === 'editLocation' ? 'Edit Location' :
                                            mode === 'data' ? 'Data' :
                                                mode === 'Historic reports' ? 'Historic reports' :
                                                    'Steps'}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col w-full h-full overflow-y-auto px-6 pb-6 pt-2">


                                {viewMode === 'data' && (
                                    <div className="flex flex-col w-full">
                                        <div className="self-end flex gap-2 border rounded-md px-3 py-2 mb-4">
                                            <CopyToClipboard text={JSON.stringify(dynamicValueForThisTest)} isDarkMode={false} />
                                            Copy dynamic values
                                        </div>
                                        <div
                                            ref={scrollRef}
                                            className={styleClasses.scrollContainer}
                                        >
                                            {!isLoadingTest && responseTest?.testData?.map((field: string, idx: number) => (
                                                <div key={`${field}-${idx}`} className="flex flex-col gap-4 px-1 break-words">
                                                    <UnifiedInput
                                                        id={`${field}-${test.testCaseId || test.id}`}
                                                        value={getFieldValue((test.testCaseId || test.id) ?? '', field)}
                                                        placeholder={`Enter ${field}`}
                                                        label={`Enter ${field}`}
                                                        isDarkMode={isDarkMode}
                                                        enableFaker={true}
                                                        onChange={(val, originalExpression) => {
                                                            const testId = (test.testCaseId || test.id) ?? '';
                                                            handleValueChange(field, val, testId, originalExpression);

                                                            setResponseTest((prev: any) => {
                                                                if (!prev) return prev;
                                                                const allFields = prev.testData || [];
                                                                const updatedTestDataObj: Record<string, string> = {};

                                                                allFields.forEach((f: string) => {
                                                                    const currentVal = f === field ? val : getFieldValue(testId, f) || "";
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
                                    </div>
                                )}

                                {viewMode === 'steps' && (
                                    <div className="flex flex-col w-full h-full overflow-y-auto">
                                        <div
                                            ref={scrollRef}
                                            className={`w-full h-full px-2 flex flex-col gap-2`}
                                        >
                                            <div className={styleClasses.stepsStickyHeader}>
                                                <div className="flex flex-wrap items-center gap-4 justify-between">
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

                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-md flex items-center gap-2 border-dashed border p-1">
                                                            <span>Copy All steps</span>
                                                            <CopyToClipboard
                                                                text={JSON.stringify(transformedStepsToCopy(responseTest?.stepsData || []), null, 2)}
                                                                isDarkMode={isDarkMode}
                                                            />
                                                        </div>
                                                    </div>
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
                                                <div key={i} className="flex flex-col gap-2">
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

                                            <TestCaseActions
                                            test={currentTestCase}
                                            onDelete={handleDelete}
                                            onUpdate={handleUpdateConfirm}
                                            isLoadingUpdate={isLoadingUpdate}
                                            isDarkMode={isDarkMode}
                                        />
                                        </div>

                                        
                                    </div>
                                )}

                                {viewMode === 'Historic reports' && test.id && (
                                    <ReportTestCaseList
                                        test={{ ...test, testCaseId: test.id }}
                                        visible={true}
                                        viewMode={viewMode}
                                    />
                                )}

                                {viewMode === 'editLocation' && (
                                    <div className="w-full p-1 pt-2 min-h-[480px] flex flex-col gap-2">
                                        <h3 className="text-center font-semibold text-lg text-primary/90 mb-4">Edit test case Information</h3>
                                        <EditLocationPanel
                                            test={test}
                                            responseTest={responseTest}
                                            setResponseTest={setResponseTest}
                                            setTestCasesData={setTestCasesData}
                                            isDarkMode={isDarkMode}
                                            isLoadingUpdate={isLoadingUpdate}
                                            setIsLoadingUpdate={setIsLoadingUpdate}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </AccordionItem>
        </div>
    );
};

export default React.memo(SortableTestCaseItem);