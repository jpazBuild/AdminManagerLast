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
    const [dynamicValues, setDynamicValues] = useState<{ id: string; input: Record<string, string>; order?: number; testCaseName?: string; createdBy?: string }[]>([]);
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

    const handleValueChange = useCallback((fieldName: string, value: string, id?: string) => {
        console.log('📝 Cambiando valor:', { fieldName, value, id, editMode });

        setDynamicValues(prev => {
            const updated = [...prev];

            if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
                console.log('🌐 Modo global: aplicando a todos los test cases');

                testCasesData.forEach((testCase, idx) => {
                    const testCaseFields = getDynamicFields(testCase);

                    if (testCaseFields.includes(fieldName)) {
                        const existingIndex = updated.findIndex(entry => entry.id === testCase.id);

                        if (existingIndex !== -1) {
                            updated[existingIndex] = {
                                ...updated[existingIndex],
                                testCaseName: testCase.testCaseName,
                                createdBy: testCase.createdBy,
                                input: {
                                    ...updated[existingIndex].input,
                                    [fieldName]: value,
                                },
                                order: idx
                            };
                        } else {
                            updated.push({
                                id: testCase.id!,
                                testCaseName: testCase.testCaseName,
                                createdBy: testCase.createdBy,
                                input: { [fieldName]: value },
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
                    current.createdBy !== testCase.createdBy ||
                    current.order !== orderIndex) {

                    updated[existingIndex] = {
                        ...current,
                        testCaseName: testCase.testCaseName,
                        createdBy: testCase.createdBy,
                        input: {
                            ...current.input,
                            [fieldName]: value,
                        },
                        order: orderIndex
                    };
                }
            } else {
                updated.push({
                    id,
                    testCaseName: testCase.testCaseName,
                    createdBy: testCase.createdBy,
                    input: { [fieldName]: value },
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

    const handleParsedJSON = useCallback((json: any[]) => {
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
                    const matchingTest = testCasesData.find(tc => tc.id === item.id);
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

    const handleExportAsDataObject = useCallback(() => {
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
    }, [dynamicValues]);

    const handleClearJSONData = useCallback(() => {
        setDynamicValues([]);
        toast.info("Dynamic values cleared.");
        if (setEditMode) setEditMode('global');
    }, [setEditMode]);

    const styleClasses = useMemo(() => ({
        container: isDarkMode
            ? "p-4 rounded-lg shadow-md border bg-gray-800 text-white border-gray-600"
            : "p-4 rounded-lg shadow-md border bg-white text-primary border-gray-200",
        globalFields: isDarkMode
            ? "p-4 rounded-lg space-y-4 shadow-md border-t-4 border-primary/60 bg-gray-700 text-white"
            : "p-4 rounded-lg space-y-4 shadow-md border-t-4 border-primary/60 bg-gray-50 text-primary",
        legend: isDarkMode
            ? "w-full flex gap-3 items-center text-xs text-gray-400 mb-1"
            : "w-full flex gap-3 items-center text-xs text-muted-foreground mb-1",
        exportButton: isDarkMode
            ? "self-end mt-2 cursor-pointer text-xs flex items-center gap-2 bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            : "self-end mt-2 cursor-pointer text-xs flex items-center gap-2",
        label: isDarkMode
            ? "w-32 text-gray-300 font-medium"
            : "w-32 text-gray-700 font-medium",
        globalFieldsTitle: isDarkMode
            ? "font-semibold text-white text-lg mb-2"
            : "font-semibold text-gray-900 text-lg mb-2",
        globalFieldsSubtitle: isDarkMode
            ? "text-sm text-gray-400 mb-4"
            : "text-sm text-gray-600 mb-4",
        fieldContainer: "flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-md border border-opacity-20 " +
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
    return (
        <div className="space-y-4">
            <div className={styleClasses.container}>
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
                            <div key={fieldName} className={styleClasses.fieldContainer}>
                                <Label className={styleClasses.label}>
                                    {fieldName}
                                </Label>
                                <div className="flex-1">
                                    <TextInputWithClearButton
                                        id={`global-${fieldName}`}
                                        value={getGlobalFieldValue(fieldName)}
                                        onChangeHandler={(e) => handleValueChange(fieldName, e.target.value)}
                                        placeholder={`Enter value for ${fieldName} (applies to all tests)`}
                                        isDarkMode={isDarkMode}
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

            {editMode === 'global' && uniqueDynamicFields.length === 0 && testCasesData.length > 0 && (
                <div className={`p-4 rounded-lg border-l-4 border-yellow-400 ${isDarkMode ? "bg-yellow-900/20 text-yellow-200" : "bg-yellow-50 text-yellow-800"
                    }`}>
                    <h4 className="font-medium mb-2">ℹ️ No Global Fields Available</h4>
                    <p className="text-sm">
                        No dynamic fields are common across all {testCasesData.length} test cases.
                        Switch to <strong>Individual Edit Mode</strong> to edit each test case separately.
                    </p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row md:flex-col justify-between items-center px-2">
                <div className={styleClasses.legend}>
                    <div className="flex items-center gap-1">
                        <span className={getLegendItemClasses('85')} />
                        <span>Tag</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={getLegendItemClasses('65')} />
                        <span>Module</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={getLegendItemClasses('50')} />
                        <span>Submodule</span>
                    </div>
                </div>
                <Button
                    onClick={handleExportAsDataObject}
                    variant="outline"
                    className={styleClasses.exportButton}
                >
                    <Download /> Export Dynamic Values
                </Button>
            </div>

            <div className="flex justify-start gap-2 px-2">
                <Button
                    onClick={handleExpandAll}
                    variant="outline"
                    size="sm"
                    className={isDarkMode ? "bg-gray-700 text-white" : ""}
                >
                    Expand All
                </Button>
                <Button
                    onClick={handleCollapseAll}
                    variant="outline"
                    size="sm"
                    className={isDarkMode ? "bg-gray-700 text-white" : ""}
                >
                    Collapse All
                </Button>
            </div>

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