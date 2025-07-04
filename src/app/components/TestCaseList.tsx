import { useState, useMemo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TextInputWithClearButton from "./InputClear";
import JSONDropzone from "./JSONDropzone";
import SortableTestCasesAccordion from "./SortableItem";
import SortableTestCaseItem from "./SortableTestCaseItem";

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
    onRefreshAfterUpdateOrDelete: () => void;
}

interface DynamicValues {
    data: Record<string, Record<string, string>>;
}


const TestCaseList: React.FC<TestCaseListProps> = ({
    testCases = [],
    selectedCases,
    toggleSelect,
    onDataChange,
    onTestCasesDataChange,
    onRefreshAfterUpdateOrDelete
}) => {
    const [editMode, setEditMode] = useState<'global' | 'individual'>('global');
    const [dynamicValues, setDynamicValues] = useState<{ id: string; input: Record<string, string>; order?: number; testCaseName?: string; createdBy?: string }[]>([]);
    const [viewMode, setViewMode] = useState<'data' | 'steps' | 'editLocation'>('data');
    const [testCasesData, setTestCasesData] = useState<TestCase[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openItems, setOpenItems] = useState<string[]>([]);

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

        return (
            valueAsString
                ?.match(/<([^>]+)>/g)
                ?.map(t => t.replace(/[<>]/g, ''))
                ?.filter(value => !value.startsWith('var'))
            || []
        );
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
                <div className="p-2 bg-card rounded-lg border space-y-3">
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
                openItems={openItems}
                setOpenItems={setOpenItems}
                renderItem={(test: TestCase, index: number) => (
                    <SortableTestCaseItem
                        test={test}
                        index={index}
                        selectedCases={selectedCases ?? []}
                        toggleSelect={toggleSelect}
                        setOpenItems={setOpenItems}
                        openItems={openItems}
                        setTestCasesData={setTestCasesData}
                        testCasesData={testCasesData}
                        getFieldValue={getFieldValue}
                        handleValueChange={handleValueChange}
                        testFields={getDynamicFields(test)}
                        onRefreshAfterUpdateOrDelete={onRefreshAfterUpdateOrDelete}
                        dynamicValues={dynamicValues}
                        setDynamicValues={setDynamicValues}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                    />
                )}
            />
        </div>
    );
};

export default TestCaseList;