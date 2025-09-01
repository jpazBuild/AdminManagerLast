import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import TextInputWithClearButton from "./InputClear";
import JSONDropzone from "./JSONDropzone";
import SortableTestCasesAccordion from "./SortableItem";
import SortableTestCaseItem from "./SortableTestCaseItem";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { TestCase } from "@/types/TestCase";
import { Checkbox } from "@/components/ui/checkbox";
import { FakerInputWithAutocomplete } from "./FakerInput";
import UnifiedInput from "./Unified";

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

interface TestCaseListProps {
    testCases?: TestCase[];
    selectedCases?: string[];
    moduleName?: string;
    subModuleName?: string;
    testCaseName?: string;
    testCaseId?: string;
    id?: string;
    toggleSelect: (name: string) => void;
    onDataChange?: (data: DynamicValues) => void;
    onStepsUpdate?: (id: string, steps: TestStep[]) => void;
    onTestCasesDataChange?: (data: TestCase[]) => void;
    onRefreshAfterUpdateOrDelete: () => void;
    editMode?: 'global' | 'individual';
    setEditMode?: (mode: 'global' | 'individual') => void;
    isDarkMode?: boolean;
}

interface DynamicValues {
    data: Record<string, Record<string, string>>;
}

interface DynamicValueEntry {
    id: string;
    input: Record<string, string>;
    originalExpressions?: Record<string, string>; // New field to store faker expressions
    order?: number;
    testCaseName?: string;
    createdByName?: string;
}

const TestCaseList: React.FC<TestCaseListProps> = ({
    testCases = [],
    selectedCases,
    toggleSelect,
    onDataChange,
    onTestCasesDataChange,
    onRefreshAfterUpdateOrDelete,
    editMode = 'global',
    setEditMode,
    isDarkMode = false
}) => {
    const [dynamicValues, setDynamicValues] = useState<DynamicValueEntry[]>([]);

    // const [dynamicValues, setDynamicValues] = useState<{ id: string; input: Record<string, string>; order?: number; testCaseName?: string; createdByName?: string }[]>([]);
    const [viewMode, setViewMode] = useState<'data' | 'steps' | 'editLocation'>('data');
    const [testCasesData, setTestCasesData] = useState<TestCase[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openItems, setOpenItems] = useState<string[]>([]);

    useEffect(() => {
        if (typeof onTestCasesDataChange === "function") {
            const timeoutId = setTimeout(() => {
                onTestCasesDataChange(testCasesData);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [testCasesData, onTestCasesDataChange]);

    useEffect(() => {
        setDynamicValues(prev => {
            const updated = prev.map(entry => {
                const newIndex = testCasesData.findIndex(tc => tc.id === entry.id);
                return newIndex !== entry.order ? { ...entry, order: newIndex } : entry;
            });

            const hasChanges = updated.some((entry, index) => entry.order !== prev[index]?.order);
            return hasChanges ? updated : prev;
        });
    }, [testCasesData]);

    useEffect(() => {
        if (JSON.stringify(testCases) !== JSON.stringify(testCasesData)) {
            setTestCasesData(testCases);
        }
    }, [testCases]);

    useEffect(() => {
        if (onDataChange) {
            const timeoutId = setTimeout(() => {
                const dataObject: Record<string, Record<string, string>> = {};
                dynamicValues.forEach(entry => {
                    dataObject[entry.id] = entry.input;
                });
                onDataChange({ data: dataObject });
            }, 50);

            return () => clearTimeout(timeoutId);
        }
    }, [dynamicValues, onDataChange]);

    const getDynamicFields = useCallback((testCase: TestCase): string[] => {
        try {
            const testCaseString = JSON.stringify(testCase);

            const patterns = [
                /<([^>]+)>/g,
                /\$\{([^}]+)\}/g,
                /\{\{([^}]+)\}\}/g
            ];

            const fields = new Set<string>();

            patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(testCaseString)) !== null) {
                    const fieldName = match[1].trim();
                    if (fieldName &&
                        !fieldName.startsWith('var') &&
                        !fieldName.startsWith('$') &&
                        !fieldName.includes('function') &&
                        fieldName.length > 0) {
                        fields.add(fieldName);
                    }
                }
            });

            return Array.from(fields);
        } catch (error) {
            console.error('Error extracting dynamic fields:', error);
            return [];
        }
    }, []);

    const isFakerExpression = useCallback((str: string): boolean => {
        return typeof str === "string" && str.startsWith("faker.");
    }, []);
    const uniqueDynamicFields = useMemo(() => {
        if (!testCasesData || testCasesData.length === 0) return [];
        const allFieldSets = testCasesData.map(testCase => {
            const fields = getDynamicFields(testCase);
            console.log(`📋 Test Case ${testCase.testCaseName}: campos encontrados:`, fields);
            return new Set(fields);
        });

        if (allFieldSets.length === 0) return [];

        const commonFields = allFieldSets.reduce((intersection, currentSet) => {
            return new Set([...intersection].filter(field => currentSet.has(field)));
        });

        const result = Array.from(commonFields);
        console.log('🎯 Campos comunes encontrados:', result);

        return result;
    }, [testCasesData, getDynamicFields]);

    const handleValueChange = useCallback((fieldName: string, value: string, id?: string, originalExpression?: string) => {
        console.log('📝 Cambiando valor:', { fieldName, value, originalExpression, id, editMode });

        setDynamicValues(prev => {
            const updated = [...prev];

            if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
                console.log('🌐 Modo global: aplicando a todos los test cases');

                testCasesData.forEach((testCase, idx) => {
                    const testCaseFields = getDynamicFields(testCase);

                    if (testCaseFields.includes(fieldName)) {
                        const existingIndex = updated.findIndex(entry => entry.id === testCase.id);

                        if (existingIndex !== -1) {
                            const currentEntry = updated[existingIndex];
                            updated[existingIndex] = {
                                ...currentEntry,
                                testCaseName: testCase.testCaseName,
                                createdByName: testCase.createdByName,
                                input: {
                                    ...currentEntry.input,
                                    [fieldName]: value,
                                },
                                originalExpressions: {
                                    ...currentEntry.originalExpressions,
                                    ...(originalExpression ? { [fieldName]: originalExpression } : {}),
                                },
                                order: idx
                            };
                        } else {
                            updated.push({
                                id: testCase.id!,
                                testCaseName: testCase.testCaseName,
                                createdByName: testCase.createdByName,
                                input: { [fieldName]: value },
                                originalExpressions: originalExpression ? { [fieldName]: originalExpression } : {},
                                order: idx
                            });
                        }
                    }
                });

                return updated;
            }

            if (!id) return prev;

            const existingIndex = updated.findIndex(entry => entry.id === id);
            const orderIndex = testCasesData.findIndex(tc => tc.id === id);
            const testCase = testCasesData.find(tc => tc.id === id);

            if (!testCase) return prev;

            if (existingIndex !== -1) {
                const current = updated[existingIndex];
                if (current.input[fieldName] !== value ||
                    current.testCaseName !== testCase.testCaseName ||
                    current.createdByName !== testCase.createdByName ||
                    current.order !== orderIndex) {

                    updated[existingIndex] = {
                        ...current,
                        testCaseName: testCase.testCaseName,
                        createdByName: testCase.createdByName,
                        input: {
                            ...current.input,
                            [fieldName]: value,
                        },
                        originalExpressions: {
                            ...current.originalExpressions,
                            ...(originalExpression ? { [fieldName]: originalExpression } : {}),
                        },
                        order: orderIndex
                    };
                }
            } else {
                updated.push({
                    id,
                    testCaseName: testCase.testCaseName,
                    createdByName: testCase.createdByName,
                    input: { [fieldName]: value },
                    originalExpressions: originalExpression ? { [fieldName]: originalExpression } : {},
                    order: orderIndex
                });
            }

            return updated;
        });
    }, [editMode, uniqueDynamicFields, testCasesData, getDynamicFields]);

    const getFieldValue = useCallback((id: string, fieldName: string) => {
        const found = dynamicValues.find(entry => entry.id === id);
        return found?.input?.[fieldName] || '';
    }, [dynamicValues]);

    const getGlobalFieldValue = useCallback((fieldName: string) => {
        const found = dynamicValues.find(entry =>
            entry.input && entry.input[fieldName] !== undefined
        );
        return found?.input?.[fieldName] || '';
    }, [dynamicValues]);

    const handleClearJSONData = useCallback(() => {
        setDynamicValues([]);
        toast.info("Dynamic values cleared.");
        if (setEditMode) setEditMode('global');
    }, [setEditMode]);

    const handleExportAsDataObject = useCallback(() => {
        const sortedDynamicValues = [...dynamicValues].sort((a, b) => {
            const orderA = a.order ?? 9999;
            const orderB = b.order ?? 9999;
            return orderA - orderB;
        });

        const exportData = sortedDynamicValues.map(({ id, input, order, testCaseName, createdByName, originalExpressions }) => {
            const exportInput: Record<string, string> = {};

            Object.keys(input).forEach(key => {
                exportInput[key] = originalExpressions?.[key] || input[key];
            });

            return {
                id,
                input: exportInput,
                order,
                testCaseName,
                createdByName
            };
        });

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "dynamic-data.json";
        a.click();
        URL.revokeObjectURL(url);
    }, [dynamicValues]);

    const handleParsedJSON = useCallback((json: any[]) => {
        if (!Array.isArray(json)) return;

        const parsed: DynamicValueEntry[] = [];
        const testCaseMap = new Map<string, DynamicValueEntry>();

        for (const item of json) {
            if (item?.id && typeof item.input === 'object') {
                const existing = testCaseMap.get(item.id);

                if (!existing || Object.keys(item.input).length > Object.keys(existing.input).length) {
                    const matchingTest = testCasesData.find(tc => tc.id === item.id);
                    testCaseMap.set(item.id, {
                        id: item.id,
                        input: item.input,
                        originalExpressions: item.originalExpressions || {},
                        order: typeof item.order === "number" ? item.order : undefined,
                        testCaseName: matchingTest?.testCaseName,
                        createdByName: matchingTest?.createdByName
                    });
                }
            }
        }

        testCaseMap.forEach(value => parsed.push(value));

        const filtered = parsed.filter(entry =>
            testCasesData.some(tc => tc.id === entry.id)
        );

        const ordered = filtered.map((entry) => {
            const indexInTestCases = testCasesData.findIndex(tc => tc.id === entry.id);
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
                const orderA = orderMap[a.id ?? ""] ?? 9999;
                const orderB = orderMap[b.id ?? ""] ?? 9999;
                return orderA - orderB;
            });
            return sorted;
        });
    }, [testCasesData]);

    const styleClasses = useMemo(() => ({
        container: isDarkMode
            ? "p-4 rounded-lg shadow-md border bg-gray-800 text-white border-gray-600"
            : "p-4 rounded-lg shadow-md border bg-white text-primary border-primary/10",
        globalFields: isDarkMode
            ? "p-4 rounded-lg space-y-4 shadow-md border-t-4 border-primary/60 bg-gray-700 text-white"
            : "p-4 rounded-lg space-y-4 shadow-md border-t-4 border-primary/60 bg-primary/5 text-primary",
        legend: isDarkMode
            ? "w-full flex gap-3 items-center text-xs text-gray-400 mb-1"
            : "w-full flex gap-3 items-center text-xs text-muted-foreground mb-1",
        exportButton: isDarkMode
            ? "self-end mt-2 cursor-pointer text-xs flex items-center gap-2 bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            : "self-end mt-2 cursor-pointer text-xs flex items-center gap-2 bg-white text-primary/90 border-primary/80 hover:bg-primary/20",
        label: isDarkMode
            ? "w-32 text-gray-300 font-medium"
            : "w-32 text-primary/80 font-medium",
        globalFieldsTitle: isDarkMode
            ? "font-semibold text-white text-lg mb-2"
            : "font-semibold text-primary/80 text-lg mb-2",
        globalFieldsSubtitle: isDarkMode
            ? "text-sm text-gray-400 mb-4"
            : "text-sm text-primary/75 mb-4",
        fieldContainer: "flex flex-col gap-2 p-3 rounded-md border border-opacity-20 " +
            (isDarkMode ? "border-gray-500 bg-gray-800" : "border-gray-300 bg-white")
    }), [isDarkMode]);

    const getLegendItemClasses = useCallback((opacity: string) => {
        if (isDarkMode) {
            return `w-3 h-3 rounded-full inline-block ${opacity === '85' ? 'bg-blue-400' :
                opacity === '65' ? 'bg-blue-500' :
                    'bg-blue-600'
                }`;
        } else {
            return `w-3 h-3 rounded-full bg-primary/${opacity} inline-block`;
        }
    }, [isDarkMode]);

    const renderTestCaseItem = useCallback((test: TestCase, index: number) => (
        <SortableTestCaseItem
            key={test.id}
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
            isDarkMode={isDarkMode}
        />
    ), [
        selectedCases,
        toggleSelect,
        openItems,
        testCasesData,
        getFieldValue,
        handleValueChange,
        getDynamicFields,
        onRefreshAfterUpdateOrDelete,
        dynamicValues,
        viewMode,
        isDarkMode
    ]);

    console.log("🔍 Debug Info:", {
        testCasesCount: testCasesData.length,
        uniqueFieldsCount: uniqueDynamicFields.length,
        uniqueFields: uniqueDynamicFields,
        editMode,
        dynamicValuesCount: dynamicValues.length
    });

    const handleExpandAll = useCallback(() => {
        const allIds = testCasesData.map(tc => tc.id ?? '');
        setOpenItems(allIds);
    }, [testCasesData]);

    const handleCollapseAll = useCallback(() => {
        setOpenItems([]);
    }, []);

    const allIds = useMemo(
        () => testCasesData.map(tc => tc.id ?? ''),
        [testCasesData]
    );

    const selectAllChecked = useMemo(() => {
        if (allIds.length === 0) return false;
        return allIds.every(id => (selectedCases ?? []).includes(id));
    }, [allIds, selectedCases]);

    const handleSelectAllChange = useCallback((checked: boolean | "indeterminate") => {
        const wantSelectAll = checked === true;

        if (wantSelectAll) {
            allIds.forEach(id => {
                if (!(selectedCases ?? []).includes(id)) {
                    toggleSelect(id);
                }
            });
        } else {
            allIds.forEach(id => {
                if ((selectedCases ?? []).includes(id)) {
                    toggleSelect(id);
                }
            });
        }
    }, [allIds, selectedCases, toggleSelect]);


    return (
        <div className="space-y-4">
            <div className="flex justify-center w-full">
                <JSONDropzone
                    onJSONParsed={handleParsedJSON}
                    onFileInfoChange={({ loaded, name }) => {
                        if (loaded && setEditMode) setEditMode('individual');
                    }}
                    onClear={handleClearJSONData}
                    isDarkMode={isDarkMode}
                />
            </div>

            {editMode === 'global' && uniqueDynamicFields.length > 0 && (
                <div className={styleClasses.globalFields}>
                    <div>
                        <h3 className={styleClasses.globalFieldsTitle}>
                            Global Dynamic Fields
                        </h3>
                        <p className={styleClasses.globalFieldsSubtitle}>
                            These fields appear in all {testCasesData.length} test cases.
                            Changes here will be applied to all tests.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {uniqueDynamicFields.map((fieldName) => (
                            <div key={fieldName} className="flex flex-col ">
                                <div className="flex-1">

                                    <UnifiedInput
                                        id={`global-${fieldName}`}
                                        value={getGlobalFieldValue(fieldName)}
                                        onChange={(value, originalExpression) => handleValueChange(fieldName, value, undefined, originalExpression)}
                                        placeholder={`Enter value for ${fieldName} (applies to all tests)`}
                                        isDarkMode={isDarkMode}
                                        enableFaker={true}
                                        label={fieldName}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {uniqueDynamicFields.length === 0 && (
                        <div className="text-center py-4">
                            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                                No common fields found across all test cases.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {allIds.length > 0 && (
                <div className="flex justify-between items-center px-2">
                    <p className="font-medium text-lg">Test cases</p>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="select-all-tests"
                            checked={selectAllChecked}
                            onCheckedChange={handleSelectAllChange}
                            className={isDarkMode ? "border-gray-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" : ""}
                        />
                        <Label htmlFor="select-all-tests">
                            {allIds.length} {allIds.length === 1 ? "Result" : "Results"}
                        </Label>
                    </div>
                </div>
            )}
            {allIds.length > 0 && (
                <div className="flex justify-between items-center">
                    <div className="flex justify-start gap-2 px-2">
                        {allIds.length > 1 && (
                            <>
                                <Button
                                    onClick={handleExpandAll}
                                    variant="outline"
                                    size="sm"
                                    className={isDarkMode ? "bg-gray-700 text-white" : "bg-white text-primary/90 hover:bg-primary/20"}
                                >
                                    Expand All
                                </Button>
                                <Button
                                    onClick={handleCollapseAll}
                                    variant="outline"
                                    size="sm"
                                    className={isDarkMode ? "bg-gray-700 text-white" : "bg-white text-primary/90 hover:bg-primary/20"}
                                >
                                    Collapse All
                                </Button>
                            </>
                        )}
                    </div>

                    <Button
                        onClick={handleExportAsDataObject}
                        variant="outline"
                        className={styleClasses.exportButton}
                    >
                        <Download /> Export Dynamic Values
                    </Button>
                </div>
            )}


            <SortableTestCasesAccordion
                testCases={testCasesData}
                setTestCasesData={setTestCasesData}
                openItems={openItems}
                setOpenItems={setOpenItems}
                isDarkMode={isDarkMode}
                renderItem={renderTestCaseItem}
            />
        </div>
    );
};

export default React.memo(TestCaseList);