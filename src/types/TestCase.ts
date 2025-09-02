export interface TestStep {
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

export interface TestCase {
    id: string;
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
    tagIds?: string[];
    name: string;
    createdBy?: string;
    createdByName?: string;
    createdAt?: string;
    tagNames?: string[];
    groupName?: string;
    testData?: Record<string, any>;
    testDataObj?: Record<string, any>;
}