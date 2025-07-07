import React, { useRef, useState } from "react";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Eye, File, FileChartColumn, Locate } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CopyToClipboard from "./CopyToClipboard";
import StepActions from "./StepActions";
import InteractionItem from "./Interaction";
import TestCaseActions from "./TestCaseActions";
import { FakerInputWithAutocomplete } from "./FakerInput";
import { toast } from "sonner";
import { handleAxiosRequest } from "@/utils/handleAxiosRequest";
import axios from "axios";
import { TOKEN_API } from "@/config";
import ReportTestCaseList from "./ReportsHistoricTestCaseList";
import { useLockScrollBubbling } from "../hooks/useLockScrollBubbling";

interface TestStep {
    action: string;
    indexStep: number;
    data: {
        attributes: Record<string, any>;
        [key: string]: unknown;
    };
}

interface TestCase {
    subModuleName?: string;
    moduleName?: string;
    testCaseName?: string;
    testCaseId?: string;
    stepsData?: TestStep[];
    jsonSteps?: TestStep[];
    tagName?: string;
    contextGeneral?: { data?: { url?: string } };
    createdBy?: string;
    createdAt?: string;
}

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
}) => {
    const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
    const currentTestCase = testCasesData.find(tc => tc?.testCaseId === test?.testCaseId);
    const steps = currentTestCase?.stepsData ?? [];
    const [updatedTest, setUpdatedTest] = useState<TestCase>(test);
    const [viewMode, setViewMode] = useState<'data' | 'steps' | 'editLocation' | 'Historic reports'>('data');
    const dataScrollRef = useRef<HTMLDivElement>(null!);
    const stepsScrollRef = useRef<HTMLDivElement>(null!);
    // useLockScrollBubbling(dataScrollRef);
    // useLockScrollBubbling(stepsScrollRef);

    const handleDelete = async () => {
        const res = await handleAxiosRequest(() =>
            axios.delete(`${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/deleteAutomationFlow`, {
                data: { testCaseId: test.testCaseId },
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN_API}`,
                },
            }),
            "Test case deleted successfully"
        );

        if (res) {
            setTestCasesData(prev => prev.filter(tc => tc.testCaseId !== test.testCaseId));
            setDynamicValues(prev => prev.filter(val => val.id !== test.testCaseId));
            onRefreshAfterUpdateOrDelete();
        }
    };

    const handleUpdateConfirm = async (test: any) => {
        setIsLoadingUpdate(true);
        try {

            const url = `${process.env.URL_API_INTEGRATION?.replace(/\/+$/, "")}/updateAutomationFlow`;
            const response = await axios.put(url, test, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${TOKEN_API}`
                },
            });
            toast.success("Test updated successfully");

            if (response?.status === 200) {
                onRefreshAfterUpdateOrDelete();
            }
        } catch (error: any) {
            console.error("Update failed:", error);
            toast.error("Failed to update test case");
        } finally {
            setIsLoadingUpdate(false);
        }
    };

    return (
        <div className="w-full shadow-md rounded-md border-t-4 border-primary/60 pt-1">
            <TestCaseActions
                test={currentTestCase}
                onDelete={handleDelete}
                onUpdate={handleUpdateConfirm}
                isLoadingUpdate={isLoadingUpdate}
            />


            <AccordionItem value={test.testCaseId ?? ''} className="rounded-lg">
                <div className="flex items-center w-full bg-primary/5 p-0.5">
                    <Checkbox
                        id={test.testCaseId ?? ''}
                        checked={selectedCases.includes(test.testCaseId ?? '')}
                        onCheckedChange={() => toggleSelect(test.testCaseId ?? '')}
                        className="cursor-pointer"
                    />
                    <AccordionTrigger
                        className="flex hover:no-underline"
                        onClick={() =>
                            setOpenItems(prev =>
                                prev.includes(test.testCaseId ?? '')
                                    ? prev.filter(id => id !== test.testCaseId)
                                    : [...prev, test.testCaseId ?? '']
                            )
                        }
                    >
                        <div className="flex flex-col w-full break-words">
                            <div className="flex justify-between gap-2 p-1 text-[10px]">
                                <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                                    <span className="text-xs font-mono text-muted-foreground">
                                        Id: {test.testCaseId}
                                    </span>
                                    {test.testCaseId && <CopyToClipboard text={test.testCaseId} />}
                                </div>
                                <span className="text-xs text-primary/80 px-2 py-1 rounded-md shadow-md">
                                    {test.createdBy}
                                </span>
                            </div>
                            <h3 className="font-medium mt-2 px-2 break-words">{test.testCaseName}</h3>
                            
                            {testFields.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 px-2 py-0.5 w-full">
                                    <span className="text-xs text-primary/70">Dynamic fields:</span>
                                    {testFields.map((field) => (
                                        <span
                                            key={field}
                                            className="text-xs text-primary/70 px-2 py-0.5 rounded-full bg-primary/5 max-w-[220px] break-words truncate"
                                            title={field}
                                        >
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between px-2 text-[11px] text-primary/80">
                                <span>{steps.length} Steps</span>
                                <span className="text-[9px]">{test.createdAt}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 px-2">
                                {test.tagName && (
                                    <span className="text-xs bg-primary/85 text-white px-2 py-1 rounded-full">
                                        {test.tagName}
                                    </span>
                                )}
                                {test.moduleName && (
                                    <span className="text-xs bg-primary/65 text-white px-2 py-1 rounded-full">
                                        {test.moduleName}
                                    </span>
                                )}
                                {test.subModuleName && (
                                    <span className="text-xs bg-primary/50 text-white px-2 py-1 rounded-full">
                                        {test.subModuleName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                </div>

                <AccordionContent className="p-2 w-full">
                    <div className="flex gap-2 overflow-x-auto">
                        {/* 'editLocation' */}
                        {['data', 'steps', 'Historic reports'].map(mode => (
                            <button
                                key={mode}
                                className={` rounded-md flex gap-2 p-2 cursor-pointer items-center bg-white shadow-md text-primary/70 ${viewMode === mode ? 'border-b-4 border-primary' : ''}`}
                                onClick={() => setViewMode(mode as any)}
                            >

                                {mode === 'editLocation' ? <Locate className="ml-1 h-6 w-6" /> :
                                    mode === 'data' ? <File className="ml-1" /> : mode === 'Historic reports' ? <FileChartColumn className="h-6 w-6" /> : <Eye className="ml-1" />}
                                {mode === 'editLocation' ? 'Edit Location' :
                                    mode === 'data' ? 'See Data' : mode === 'Historic reports' ? 'Historic reports' : 'See Steps'}
                            </button>
                        ))}
                    </div>


                    {viewMode === 'Historic reports' && test.testCaseId && (
                        <ReportTestCaseList
                            test={{ ...test, testCaseId: test.testCaseId }}
                            visible={true}
                            viewMode={viewMode}
                        />
                    )}
                    {/* <EditLocationFields
                        visible={viewMode === 'editLocation'}
                        test={updatedTest}
                        onUpdate={handleFieldChange}
                    /> */}
                    {viewMode === 'data' && (
                        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1 mt-4 p-2">
                            {testFields.map((field, idx) => (
                                <div key={`${field}-${idx}`} className="flex flex-col gap-4 px-1 break-words">
                                    <Label className="w-full text-primary/90 break-words max-w-[480px] truncate">{field}</Label>
                                    <FakerInputWithAutocomplete
                                        id={`${field}-${test.testCaseId}`}
                                        value={getFieldValue(test.testCaseId ?? '', field)}
                                        onChange={(val) => handleValueChange(field, val, test.testCaseId ?? '')}
                                        placeholder={`Enter ${field}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}


                    {viewMode === 'steps' && (
                        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1">
                            <div className="self- end mt-4 mb-3 flex gap-1 items-center border-2 border-primary/60 rounded-md p-1">
                                <span>Copy All steps</span>
                                <CopyToClipboard text={JSON.stringify(steps)} />
                            </div>
                            <StepActions index={-1} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
                            {steps.map((step, i) => (
                                <div key={i} className="flex flex-col">
                                    <InteractionItem
                                        data={{ id: `${test.testCaseId}-step-${i}`, ...step }}
                                        index={i}
                                        onDelete={(idx) => {
                                            const updated = steps.filter((_, j) => j !== idx).map((s, k) => ({ ...s, indexStep: k + 1 }));
                                            setTestCasesData(prev => {
                                                const newData = [...prev];
                                                newData[index] = { ...newData[index], stepsData: updated };
                                                return newData;
                                            });
                                        }}
                                        onUpdate={(idx, newStep) => {

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
                                    />
                                    <StepActions index={i} steps={steps} test={{ ...test, index }} setTestCasesData={setTestCasesData} />
                                </div>
                            ))}
                        </div>

                        // <>
                        //     <pre className="bg-primary/20 text-primary p-4 rounded-md overflow-auto text-xs font-mono max-h-64">
                        //         <code>{JSON.stringify(testCasesData.find(tc => tc?.testCaseId === test?.testCaseId), null, 2)}</code>
                        //     </pre>
                        // </>
                    )}
                </AccordionContent>
            </AccordionItem>
        </div>
    );
};

export default SortableTestCaseItem;
