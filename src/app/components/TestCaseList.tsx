import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface TestStep {
    action: string;
    data: {
        attributes: {
            value?: string;
            [key: string]: any;
        };
    };
}

interface TestCase {
    testCaseName: string;
    testCaseId: string;
    stepsData?: TestStep[];
    jsonSteps?: TestStep[];
    contextGeneral?: {
        data?: {
            url?: string;
        };
    };
    createdBy:string
    createdAt:string
}

interface TestCaseListProps {
    testCases: TestCase[];
    selectedCases: string[];
    toggleSelect: (name: string) => void;
    onDataChange?: (data: DynamicValues) => void;
}

interface DynamicValues {
    data: Record<string, Record<string, string>>;
}

const TestCaseList: React.FC<TestCaseListProps> = ({
    testCases = [],
    selectedCases,
    toggleSelect,
    onDataChange
}) => {
    
    const [editMode, setEditMode] = useState<'global' | 'individual'>('global');
    const [dynamicValues, setDynamicValues] = useState<DynamicValues>({ data: {} });

    useEffect(() => {
        if (onDataChange) {
            onDataChange(dynamicValues);
        }
    }, [dynamicValues, onDataChange]);

    // ✅ Extrae valores dinámicos correctamente y asegura que sean únicos
    const getDynamicFields = (jsonTest: any) => {
        const valueAsString = typeof jsonTest === "string" ? jsonTest : JSON.stringify(jsonTest);
        const matchFields = valueAsString.match(/<([^>]+)>/g)?.map(t => t.replace(/[<>]/g, '')) || [];
        return matchFields;
    };

    // ✅ Encuentra los campos dinámicos en TODOS los testCases
    const uniqueDynamicFields = useMemo(() => {
        if (testCases.length === 0) return [];

        const fieldCounts = new Map<string, number>();

        testCases.forEach((test) => {
            const uniqueFieldsInTest = new Set<string>();
            const dynamicFields = getDynamicFields(test);
            
            dynamicFields.forEach(field => uniqueFieldsInTest.add(field));

            uniqueFieldsInTest.forEach(field => {
                fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
            });
        });

        return [...fieldCounts.keys()];
    }, [testCases]);

    // ✅ Maneja la actualización de valores en modo global e individual
    const handleValueChange = (fieldName: string, value: string, testId?: string) => {
        setDynamicValues(prev => {
            const updatedData = { ...prev.data };

            if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
                testCases.forEach((test) => {
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

    // ✅ Obtiene valores asegurando valores predeterminados
    const getFieldValue = (testId: string, fieldName: string) => {
        if (editMode === 'global' && uniqueDynamicFields.includes(fieldName)) {
            return Object.values(dynamicValues.data).find(data => data[fieldName])?.[fieldName] || '';
        }
        return dynamicValues.data[testId]?.[fieldName];
    };

    return (
        <div className="space-y-4">
            {/* ✅ Switch para cambiar entre edición global e individual */}
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

            {/* ✅ Renderiza los campos globales si hay dinámicos */}
            {editMode === 'global' && uniqueDynamicFields.length > 0 && (
                <div className="p-4 bg-card rounded-lg border space-y-3">
                    <h3 className="font-medium">Global Dynamic Fields</h3>
                    {uniqueDynamicFields.map((fieldName) => (
                        <div key={fieldName} className="flex items-center gap-3">
                            <Label className="w-32">{fieldName}</Label>
                            <input
                                type="text"
                                placeholder={`Enter ${fieldName}`}
                                value={Object.values(dynamicValues.data)?.[0]?.[fieldName] || ''}
                                onChange={(e) => handleValueChange(fieldName, e.target.value)}
                                className="flex-1 p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* ✅ Renderiza cada testCase con sus campos dinámicos */}
            <Accordion type="multiple" className="space-y-2">
                {testCases.map((test) => {
                    const testFields = getDynamicFields(test);                    
                    return (
                        <AccordionItem key={test.testCaseId} value={test.testCaseId} className="border rounded-lg">
                            <div className="relative flex items-center gap-2 px-4 py-2 bg-muted/50">
                                <Checkbox
                                    checked={selectedCases.includes(test.testCaseId)}
                                    onCheckedChange={() => toggleSelect(test.testCaseId)}
                                />
                                <AccordionTrigger className="flex-1 hover:no-underline">
                                    <div className="flex-1 text-left">
                                        <h3 className="font-medium">{test.testCaseName}</h3>
                                        {testFields.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                Dynamic fields: {testFields.join(', ')}
                                            </p>
                                        )}
                                        
                                    </div>
                                </AccordionTrigger>
                                <span className="text-xs text-[#223853]/80 absolute top-0 right-0 p-1 shadow-md rounded-md">
                                            {test?.createdBy}
                                </span>
                                <span className="text-[9px] text-[#223853]/80 absolute bottom-0 right-0 p-1 rounded-md">
                                            {test?.createdAt}
                                </span>
                            </div>

                            <AccordionContent className="p-4 space-y-3">
                                {testFields.map((fieldName) => (
                                    <div key={fieldName} className="flex items-center gap-3">
                                        <Label className="w-32">{fieldName}</Label>
                                        <input
                                            type="text"
                                            placeholder={`Enter ${fieldName}`}
                                            value={getFieldValue(test.testCaseName, fieldName)}
                                            onChange={(e) => handleValueChange(fieldName, e.target.value, test.testCaseName)}
                                            readOnly={editMode === 'global' && uniqueDynamicFields.includes(fieldName)}
                                            className="flex-1 p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
};

export default TestCaseList;