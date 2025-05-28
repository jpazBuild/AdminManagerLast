import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Eye, File } from "lucide-react";
import InteractionItem from "./Interaction";
import TextInputWithClearButton from "./InputClear";
import JSONDropzone from "./JSONDropzone";
import CopyToClipboard from "./CopyToClipboard";
import { toast } from "sonner";
import StepActions from "./StepActions";
import { FakerInputWithAutocomplete } from "./FakerInput";
import SortableTestCasesAccordion from "./SortableItem";
import FileDropzone from "./FileDropZone";

interface TestStep {
    action: string;
    indexStep: number;
    data: {
        attributes: {
            value?: string;
            [key: string]: string | number | boolean | undefined | Record<string, unknown>;
        };
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
    moduleName?: string;
    subModuleName?: string;
    testCaseName?: string;
    testCaseId?: string;
    toggleSelect: (name: string) => void;
    onDataChange?: (data: DynamicValues) => void;
    onStepsUpdate?: (id: string, steps: TestStep[]) => void;
    onTestCasesDataChange?: (data: TestCase[]) => void;
}

interface DynamicValues {
    data: Record<string, Record<string, string>>;
}

const TestCaseList: React.FC<TestCaseListProps> = ({
    testCases = [],
    selectedCases,
    toggleSelect,
    onDataChange,
    onTestCasesDataChange
}) => {
    const [editMode, setEditMode] = useState<'global' | 'individual'>('global');
    const [dynamicValues, setDynamicValues] = useState<{ id: string; input: Record<string, string>; order?: number; testCaseName?: string; createdBy?: string }[]>([]);
    const [viewMode, setViewMode] = useState<'data' | 'steps'>('data');
    const [testCasesData, setTestCasesData] = useState<TestCase[]>([]);
    useEffect(() => {
        if (typeof onTestCasesDataChange === "function") {
            onTestCasesDataChange(testCasesData);
        }
    }, [testCasesData, onTestCasesDataChange]);

    useEffect(() => {
        setDynamicValues(prev =>
            prev.map(entry => {
                const newIndex = testCasesData.findIndex(tc => tc.testCaseId === entry.id);
                return { ...entry, order: newIndex };
            })
        );
    }, [testCasesData]);

    useEffect(() => {
        setTestCasesData(testCases);
    }, [testCases])

    useEffect(() => {
        if (onDataChange) {
            const dataObject: Record<string, Record<string, string>> = {};
            dynamicValues.forEach(entry => {
                dataObject[entry.id] = entry.input;
            });
            onDataChange({ data: dataObject });
        }
    }, [dynamicValues]);

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

    const handleValueChange = (fieldName: string, value: string, id?: string) => {
        setDynamicValues(prev => {
            const updated = [...prev];

            if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
                const ids = testCases.map(tc => tc.testCaseId).filter(Boolean) as string[];
                const testCaseName = testCases.find(tc => tc.testCaseId === id)?.testCaseName || '';
                const testCreatedBy = testCases.find(tc => tc.testCaseId === id)?.createdBy || '';
                ids.forEach((id, idx) => {
                    const index = updated.findIndex(entry => entry.id === id);
                    if (index !== -1) {
                        updated[index] = {
                            ...updated[index],
                            testCaseName,
                            input: {
                                ...updated[index].input,
                                [fieldName]: value,
                            },
                            createdBy: testCreatedBy,
                            order: idx
                        };
                    } else {
                        updated.push({
                            id: id,
                            testCaseName,
                            input: { [fieldName]: value },
                            createdBy: testCreatedBy,
                            order: idx
                        });
                    }
                });

                return updated;
            }

            if (!id) return prev;

            const existingIndex = updated.findIndex(entry => entry.id === id);
            const orderIndex = testCases.findIndex(tc => tc.testCaseId === id);
            const testCaseNameExists = testCases.find(tc => tc.testCaseId === id)?.testCaseName || '';
            const testCreatedByExist = testCases.find(tc => tc.testCaseId === id)?.createdBy || '';
            if (existingIndex !== -1) {
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    testCaseName: testCaseNameExists,
                    input: {
                        ...updated[existingIndex].input,
                        [fieldName]: value,
                    },
                    createdBy: testCreatedByExist,
                    order: orderIndex
                };
            } else {
                updated.push({
                    id,
                    testCaseName: testCaseNameExists,
                    input: { [fieldName]: value },
                    createdBy: testCreatedByExist,
                    order: orderIndex
                });
            }

            return updated;
        });
    };


    const getFieldValue = (id: string, fieldName: string) => {
        const found = dynamicValues.find(entry => entry.id === id);
        return found?.input?.[fieldName] || '';
    };

    const handleParsedJSON = (json: any[]) => {
        if (!Array.isArray(json)) return;
        const parsed: {
            id: string;
            input: Record<string, string>;
            order?: number;
            testCaseName?: string;
            createdBy?: string;
        }[] = [];

        const testCaseMap = new Map<string, typeof parsed[number]>();

        for (const item of json) {
            if (item?.id && typeof item.input === 'object') {
                const existing = testCaseMap.get(item.id);

                if (!existing || Object.keys(item.input).length > Object.keys(existing.input).length) {
                    const matchingTest = testCasesData.find(tc => tc.testCaseId === item.id);
                    testCaseMap.set(item.id, {
                        id: item.id,
                        input: item.input,
                        order: typeof item.order === "number" ? item.order : undefined,
                        testCaseName: matchingTest?.testCaseName,
                        createdBy: matchingTest?.createdBy
                    });
                }
            }
        }

        testCaseMap.forEach(value => parsed.push(value));

        const filtered = parsed.filter(entry =>
            testCasesData.some(tc => tc.testCaseId === entry.id)
        );

        const ordered = filtered.map((entry) => {
            const indexInTestCases = testCasesData.findIndex(tc => tc.testCaseId === entry.id);
            return {
                ...entry,
                order: entry.order ?? indexInTestCases,
            };
        });

        ordered.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
        setDynamicValues(ordered);

        const orderMap = ordered.reduce((acc, item) => {
            if (item.id && typeof item.order === "number") {
                acc[item.id] = item.order;
            }
            return acc;
        }, {} as Record<string, number>);

        setTestCasesData(prev => {
            const sorted = [...prev];
            sorted.sort((a, b) => {
                const orderA = orderMap[a.testCaseId ?? ""] ?? 9999;
                const orderB = orderMap[b.testCaseId ?? ""] ?? 9999;
                return orderA - orderB;
            });
            return sorted;
        });
    };

    const handleExportAsDataObject = () => {
        const sortedDynamicValues = [...dynamicValues].sort((a, b) => {
            const orderA = a.order ?? 9999;
            const orderB = b.order ?? 9999;
            return orderA - orderB;
        });

        const exportData = sortedDynamicValues.map(({ id, input, order, testCaseName, createdBy }) => ({
            id,
            input,
            order,
            testCaseName,
            createdBy
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dynamic-data.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-3 p-2 bg-card rounded-lg">
                <div className="flex items-center gap-2">
                    <Switch
                        id="edit-mode"
                        checked={editMode === 'global'}
                        onCheckedChange={(checked) => setEditMode(checked ? 'global' : 'individual')}
                    />
                    <Label htmlFor="edit-mode" className="font-medium">
                        {editMode === 'global' ? 'Editing all tests' : 'Editing individual tests'}
                    </Label>
                </div>
                <JSONDropzone onJSONParsed={handleParsedJSON}
                    onFileInfoChange={({ loaded, name }) => {
                        if (loaded) setEditMode('individual')
                    }}
                />
            </div>


            {editMode === 'global' && uniqueDynamicFields.length > 0 && (
                <div className="p-4 bg-card rounded-lg border space-y-3">
                    <h3 className="font-medium">Global Dynamic Fields</h3>
                    {uniqueDynamicFields.map((fieldName) => (
                        <div key={fieldName} className="flex items-center gap-3">
                            <Label className="w-32">{fieldName}</Label>
                            <TextInputWithClearButton
                                id={fieldName}
                                value={
                                    (() => {
                                        const matching = dynamicValues.find(v =>
                                            uniqueDynamicFields.includes(fieldName) &&
                                            Object.keys(v.input || {}).includes(fieldName)
                                        );
                                        return matching?.input?.[fieldName] || '';
                                    })()
                                }

                                onChangeHandler={(e) => handleValueChange(fieldName, e.target.value)}
                                placeholder={`Enter ${fieldName}`}
                            />
                        </div>
                    ))}
                </div>
            )}
            <div className="flex gap-3 items-center text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full text-primary/85 bg-primary/85 inline-block" />
                    <span>Tag</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full text-primary/65 bg-primary/65 inline-block" />
                    <span>Module</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full text-primary/50 bg-primary/50 inline-block" />
                    <span>Submodule</span>
                </div>
            </div>
            <Button onClick={handleExportAsDataObject} variant="outline" className="text-xs">
                Export Dynamic Values
            </Button>

            <SortableTestCasesAccordion
                testCases={testCasesData}
                setTestCasesData={setTestCasesData}
                renderItem={(test: TestCase, index: number) => {
                    const testFields = getDynamicFields(test);
                    const currentTestCase = testCasesData.find(tc => tc?.testCaseId === test?.testCaseId);
                    const steps = currentTestCase?.stepsData ?? [];

                    return (
                        <AccordionItem key={`${test.testCaseId} ${index}`} value={test.testCaseId ?? ''} className="border rounded-lg">
                            <div className="flex items-center w-full h-auto bg-primary/5 p-0.5">
                                <Checkbox
                                    id={test.testCaseId ?? ''}
                                    checked={selectedCases?.includes(test.testCaseId ?? '')}
                                    onCheckedChange={() => toggleSelect(test.testCaseId ?? '')}
                                />
                                <AccordionTrigger className="flex hover:no-underline">
                                    <div className="flex flex-col w-full h-auto">
                                        <div className="flex justify-between w-full gap-2 items-center p-1 rounded-br-xl text-[10px]">
                                            <div className="flex gap-2 items-center border-2 p-0.5 rounded-md border-dotted border-primary/20">
                                                <span className="text-xs font-mono tracking-wide text-muted-foreground">
                                                    Id: {test.testCaseId}
                                                </span>
                                                {test.testCaseId ? (<CopyToClipboard text={test.testCaseId ?? ''} />) : (toast.error("No ID found"))}
                                            </div>
                                            <span className="text-xs break-words text-primary/80 shadow-md rounded-md px-2 py-1">
                                                {test.createdBy}
                                            </span>
                                        </div>
                                        <h3 className="font-medium mt-2 px-2">{test.testCaseName}</h3>
                                        {testFields.length > 0 && (
                                            <p className="text-xs px-2 break-all whitespace-pre-wrap text-primary/70">
                                                Dynamic fields: {testFields.join(", ")}
                                            </p>
                                        )}
                                        <div className="flex justify-between w-full">
                                            <span className="p-1 text-[11px] text-primary/80 rounded-md">
                                                {currentTestCase?.stepsData?.length} Steps
                                            </span>

                                            <span className="p-1 text-[9px] text-primary/80 rounded-md">
                                                {test.createdAt}
                                            </span>
                                        </div>
                                        {(test?.tagName || test?.moduleName || test?.subModuleName) && (
                                            <div className="w-full flex flex-col lg:flex-row gap-1 rounded-md shadow-sm overflow-x-auto">
                                                {test?.tagName && (
                                                    <span className="text-xs text-white bg-primary/85 px-2 py-1 rounded-full">
                                                        {test.tagName}
                                                    </span>
                                                )}
                                                {test?.moduleName && (
                                                    <span className="text-xs text-white bg-primary/65 px-2 py-1 rounded-full">
                                                        {test.moduleName}
                                                    </span>
                                                )}
                                                {test?.subModuleName && (
                                                    <span className="text-xs text-white bg-primary/50 px-2 py-1 rounded-full">
                                                        {test.subModuleName}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </AccordionTrigger>
                            </div>


                            <AccordionContent className="p-4 space-y-3">
                                <div className="flex gap-2">
                                    <Button className={`bg-white hover:bg-white shadow-md text-primary/70 ${viewMode === 'data' ? 'border-b-4 border-primary' : ''}`} onClick={() => setViewMode('data')}>See Data <File className="ml-1" /></Button>
                                    <Button className={`bg-white hover:bg-white shadow-md text-primary/70 ${viewMode === 'steps' ? 'border-b-4 border-primary' : ''}`} onClick={() => setViewMode('steps')}>See steps <Eye className="ml-1" /></Button>
                                </div>
                                {viewMode === 'data' ? (
                                    testFields.map((fieldName, index: number) => (
                                        <div key={`${fieldName} ${test.testCaseId} ${index}`} className="flex items-center gap-3">
                                            <Label className="w-32 break-words">{fieldName}</Label>

                                            {(() => {
                                                const currentValue = getFieldValue(test.testCaseId ?? '', fieldName);

                                                const valueMimeMatch = typeof currentValue === "string"
                                                    ? currentValue.match(/^data:(.*?);base64,/)
                                                    : null;
                                                const extractedMime = valueMimeMatch ? valueMimeMatch[1] : "";

                                                const mimeFromFieldName = (() => {
                                                    const regex = /\.(application\/json|application\/pdf|text\/csv|image\/[a-zA-Z0-9.+-]+)$/;
                                                    const match = fieldName.match(regex);
                                                    return match ? match[1] : "application/octet-stream";
                                                })();

                                                const allowedMime = mimeFromFieldName;

                                                const label = (() => {
                                                    if (allowedMime.startsWith("image/")) return "Upload image";
                                                    if (allowedMime === "application/pdf") return "Upload PDF";
                                                    if (allowedMime === "text/csv") return "Upload CSV";
                                                    if (allowedMime === "application/json") return "Upload JSON";
                                                    return "Upload file";
                                                })();

                                                const isPossiblyFileField =
                                                    fieldName.includes('.') &&
                                                    (
                                                        fieldName.startsWith("file.") ||
                                                        allowedMime !== "application/octet-stream" ||
                                                        (typeof currentValue === "string" && currentValue.startsWith("data:"))
                                                    );

                                                if (isPossiblyFileField) {
                                                    return (
                                                        <FileDropzone
                                                            label={label}
                                                            acceptedExtensions={[allowedMime]}
                                                            onFileParsed={(base64, file) => {
                                                                const mime = file?.type || "";
                                                                let messageType = "File";

                                                                if (mime.startsWith("image/")) messageType = "Image";
                                                                else if (mime === "application/pdf") messageType = "PDF";
                                                                else if (mime === "text/csv") messageType = "CSV";
                                                                else if (mime === "application/json") messageType = "JSON";

                                                                if (mime !== allowedMime) {
                                                                    toast.error(`❌ Invalid file type. Expected: ${allowedMime}`);
                                                                    return;
                                                                }

                                                                toast.success(`✅ ${messageType} loaded: ${file?.name}`);
                                                                handleValueChange(fieldName, base64, test.testCaseId);
                                                            }}
                                                            onFileInfoChange={({ name }) => {
                                                                console.log(`Selected file: ${name}`);
                                                            }}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <FakerInputWithAutocomplete
                                                        id={`${fieldName} ${test.testCaseId} ${index}`}
                                                        value={getFieldValue(test.testCaseId ?? '', fieldName)}
                                                        onChange={(val: string) => handleValueChange(fieldName ?? '', val, test.testCaseId)}
                                                        placeholder={`Enter ${fieldName}`}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="self-end mb-3 flex gap-2 items-center border-2 border-primary/60 rounded-md hover:shadow-md p-1">
                                            <span>Copy All steps</span>
                                            <CopyToClipboard text={JSON.stringify(currentTestCase?.stepsData)} />
                                        </div>
                                        {steps.length > 0 && (
                                            <StepActions
                                                index={-1}
                                                steps={steps}
                                                test={{ ...test, index }}
                                                setTestCasesData={setTestCasesData}
                                            />
                                        )}

                                        {steps.map((step: any, i: number) => (
                                            <div key={i} className="flex flex-col">
                                                <InteractionItem
                                                    data={step}
                                                    index={i}
                                                    isContext={false}
                                                    onDelete={(stepIndex) => {
                                                        const updatedSteps = [...steps];
                                                        updatedSteps.splice(stepIndex, 1);
                                                        const reindexed = updatedSteps.map((step, idx) => ({
                                                            ...step,
                                                            indexStep: idx + 1,
                                                        }));
                                                        setTestCasesData((prev) => {
                                                            const updatedTests = [...prev];
                                                            updatedTests[index] = {
                                                                ...updatedTests[index],
                                                                stepsData: reindexed,
                                                            };
                                                            return updatedTests;
                                                        });
                                                    }}
                                                    onUpdate={(indexToUpdate, newData) => {
                                                        const updatedSteps = [...steps];
                                                        updatedSteps[indexToUpdate] = {
                                                            ...updatedSteps[indexToUpdate],
                                                            ...newData,
                                                        };
                                                        setTestCasesData((prev) => {
                                                            const updatedTests = [...prev];
                                                            updatedTests[index] = {
                                                                ...updatedTests[index],
                                                                stepsData: updatedSteps,
                                                            };
                                                            return updatedTests;
                                                        });
                                                    }}
                                                />
                                                <StepActions
                                                    index={i}
                                                    steps={steps}
                                                    test={{ ...test, index }}
                                                    setTestCasesData={setTestCasesData}
                                                />
                                            </div>
                                        ))}

                                    </div>
                                )}
                            </AccordionContent>

                        </AccordionItem>
                    );
                }}
            />

        </div>
    );
};

export default TestCaseList;