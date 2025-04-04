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
    module: string;
    submodule: string[];
    tags: string[];
    contextGeneral:{};
    jsonSteps:any,
    createdBy: string;
}