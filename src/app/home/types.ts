// types.ts
export interface Module {
    id: string;
    name: string;
}

export interface Submodule {
    id: string;
    name: string;
    moduleName: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface TestCase {
    id: string;
    name: string;
    testCaseName?: string;
    module: string;
    submodule: string[];
    subModuleName?: string;
    tags: string[];
    contextGeneral:any;
    jsonSteps:any,
    createdBy: string;
}

export interface Step {
    status?: string;
    time?: number;
    action?: string;
    result?: string;
    error?: string;
    screenshot?: string;
}

export interface StepData {
    data?: {
        selectors?: { type: string; locator: string }[];
    };
    action?: string;
};

export interface DataJsonStep extends StepData {
    indexStep: number;
};