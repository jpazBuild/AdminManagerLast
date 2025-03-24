import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Eye, File, Clock, Check } from "lucide-react";
import InteractionItem from "./Interaction";
import { FaXmark } from "react-icons/fa6";
import TextInputWithClearButton from "./InputClear";

interface TestStep {
    action: string;
    indexStep: number;
    data: {
        attributes: {
            value?: string;
            [key: string]: any;
        };
        [key: string]: any;
    };
}

interface TestCase {
    testCaseName?: string;
    testCaseId?: string;
    stepsData?: TestStep[];
    jsonSteps?: TestStep[];
    contextGeneral?: {
        data?: {
            url?: string;
        };
    };
    createdBy?: string;
    createdAt?: string;
}

interface TestCaseListProps {
    testCases?: TestCase[];
    selectedCases?: string[];
    toggleSelect: (name: string) => void;
    onDataChange?: (data: DynamicValues) => void;
    onStepsUpdate?: (testId: string, steps: TestStep[]) => void;
}

interface DynamicValues {
    data: Record<string, Record<string, string>>;
}

const TestCaseList: React.FC<TestCaseListProps> = ({
    testCases = [],
    selectedCases,
    toggleSelect,
    onDataChange,
}) => {
    const [editMode, setEditMode] = useState<'global' | 'individual'>('global');
    const [dynamicValues, setDynamicValues] = useState<DynamicValues>({ data: {} });
    const [viewMode, setViewMode] = useState<'data' | 'steps'>('data');
    const [waitInputs, setWaitInputs] = useState<Record<number, string | undefined>>({});

    useEffect(() => {
        if (onDataChange) {
            onDataChange(dynamicValues);
        }
    }, [dynamicValues, onDataChange]);

    const getDynamicFields = (jsonTest: any) => {
        const valueAsString = typeof jsonTest === "string" ? jsonTest : JSON.stringify(jsonTest);
        return valueAsString.match(/<([^>]+)>/g)?.map(t => t.replace(/[<>]/g, '')) || [];
    };

    const uniqueDynamicFields = useMemo(() => {
        if (testCases.length === 0) return [];
        const fieldLists = testCases.map(test => new Set(getDynamicFields(test)));
        const commonFields = [...fieldLists.reduce((acc, fields) =>
            acc.size === 0 ? fields : new Set([...acc].filter(field => fields.has(field)))
            , new Set<string>())];
        return commonFields;
    }, [testCases]);

    const handleValueChange = (fieldName: string, value: string, testId?: string) => {
        setDynamicValues(prev => {
            const updatedData = { ...prev.data };
            if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
                testCases?.forEach((test: any) => {
                    if (!updatedData[test.testCaseName]) {
                        updatedData[test.testCaseName] = { ...prev.data[test.testCaseName] };
                    }
                    updatedData[test.testCaseName][fieldName] = value;
                });
            } else if (testId) {
                if (!updatedData[testId]) {
                    updatedData[testId] = { ...prev.data[testId] };
                }
                updatedData[testId][fieldName] = value;
            }
            return { data: updatedData };
        });
    };

    const getFieldValue = (testId: string, fieldName: string) => {
        if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
            return Object.values(dynamicValues.data).find(data => data[fieldName])?.[fieldName] || '';
        }
        return dynamicValues.data[testId]?.[fieldName];
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-2 bg-card rounded-lg">
                <Switch
                    id="edit-mode"
                    checked={editMode === 'global'}
                    onCheckedChange={(checked) => setEditMode(checked ? 'global' : 'individual')}
                />
                <Label htmlFor="edit-mode" className="font-medium">
                    {editMode === 'global' ? 'Editing all tests' : 'Editing individual tests'}
                </Label>
            </div>

            {editMode === 'global' && uniqueDynamicFields.length > 0 && (
                <div className="p-4 bg-card rounded-lg border space-y-3">
                    <h3 className="font-medium">Global Dynamic Fields</h3>
                    {uniqueDynamicFields.map((fieldName) => (
                        <div key={fieldName} className="flex items-center gap-3">
                            <Label className="w-32">{fieldName}</Label>
                            <TextInputWithClearButton
                                id={fieldName}
                                value={Object.values(dynamicValues.data)?.[0]?.[fieldName] || ''}
                                onChangeHandler={(e) => handleValueChange(fieldName, e.target.value)}
                                placeholder={`Enter ${fieldName}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            <Accordion type="multiple" className="space-y-2">
                {testCases.map((test: any) => {
                    const testFields = getDynamicFields(test);
                    const steps = test?.stepsData ?? [];

                    return (
                        <AccordionItem key={test.testCaseId} value={test.testCaseId} className="border rounded-lg">
                            <div className="relative flex items-center gap-2 px-4 py-2 bg-muted/50">
                                <Checkbox
                                    checked={selectedCases?.includes(test.testCaseId)}
                                    onCheckedChange={() => toggleSelect(test.testCaseId)}
                                />
                                <AccordionTrigger className="flex-1 hover:no-underline">
                                    <div className="flex-1 text-left">
                                        <h3 className="font-medium">{test.testCaseName}</h3>
                                        {testFields.length > 0 && (
                                            <p className="text-sm text-muted-foreground">Dynamic fields: {testFields.join(', ')}</p>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <span className="text-xs text-[#223853]/80 absolute top-0 right-0 p-1 shadow-md rounded-md">{test.createdBy}</span>
                                <span className="text-[9px] text-[#223853]/80 absolute bottom-0 right-0 p-1 rounded-md">{test.createdAt}</span>
                            </div>

                            <AccordionContent className="p-4 space-y-3">
                                <div className="flex gap-2">
                                    <Button className={`bg-white hover:bg-white shadow-md text-[#223853]/70 ${viewMode === 'data' ? 'border-b-4 border-[#223853]':''}`} onClick={() => setViewMode('data')}>See Data <File className="ml-1" /></Button>
                                    <Button className={`bg-white hover:bg-white shadow-md text-[#223853]/70 ${viewMode === 'steps' ? 'border-b-4 border-[#223853]':''}`} onClick={() => setViewMode('steps')}>See steps <Eye className="ml-1" /></Button>
                                </div>
                                {viewMode === 'data' ? (
                                    testFields.map((fieldName) => (
                                        <div key={fieldName} className="flex items-center gap-3">
                                            <Label className="w-32">{fieldName}</Label>
                                            <TextInputWithClearButton
                                                id={`${fieldName} ${test.testCaseId}` }
                                                value={getFieldValue(test.testCaseName, fieldName)}
                                                onChangeHandler={(e) => handleValueChange(fieldName, e?.target?.value, test.testCaseName)}
                                                placeholder={`Enter ${fieldName}`}
                                                disabled={editMode === 'global' && uniqueDynamicFields.includes(fieldName)}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {steps.map((step: any, i: number) => (
                                            <div key={i}>
                                                <InteractionItem
                                                    data={step}
                                                    index={i}
                                                    isContext={false}
                                                    onStepUpdate={(updated: any) => {
                                                        const newSteps = [...steps];
                                                        newSteps[i] = updated;
                                                        test.stepsData = newSteps
                                                    }}
                                                />

                                                <div className="ml-2 mt-1 flex flex-col gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs w-fit"
                                                        onClick={() =>
                                                            setWaitInputs((prev) => ({
                                                                ...prev,
                                                                [i]: prev[i] !== undefined ? undefined : "1000",
                                                            }))
                                                        }
                                                    >
                                                        <Clock className="mr-1 h-3 w-3" /> Add Wait
                                                    </Button>

                                                    {waitInputs[i] !== undefined && (
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                className="p-1 border rounded-md text-xs w-32"
                                                                value={waitInputs[i]}
                                                                onChange={(e) =>
                                                                    setWaitInputs((prev) => ({
                                                                        ...prev,
                                                                        [i]: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Wait (ms)"
                                                            />
                                                            <button
                                                                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                                                                onClick={() => {
                                                                    const ms = parseInt(waitInputs[i] || '', 10);
                                                                    if (!isNaN(ms)) {
                                                                        const newSteps = [...steps];
                                                                        newSteps.splice(i + 1, 0, {
                                                                            action: "wait",
                                                                            data: {
                                                                                attributes: {
                                                                                    value: String(ms),
                                                                                },
                                                                            },
                                                                            indexStep: 0,
                                                                        });

                                                                        const reindexed = newSteps.map((step, idx) => ({
                                                                            ...step,
                                                                            indexStep: idx,
                                                                        }));
                                                                        test.stepsData = reindexed
                                                                        setWaitInputs((prev) => ({ ...prev, [i]: undefined }));
                                                                    }
                                                                }}
                                                            >
                                                                <Check size={16}/>
                                                            </button>
                                                            <button
                                                                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                                                                onClick={() =>
                                                                    setWaitInputs((prev) => ({
                                                                        ...prev,
                                                                        [i]: undefined,
                                                                    }))
                                                                }
                                                            >
                                                                <FaXmark size={16}/>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
};

export default TestCaseList;
