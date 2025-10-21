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
    testCaseId?: string;
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

export type User = {
    passwordHash: string;
    createdAt: number;
    id: string;
    name: string;
    route: string;
    type: string;
};


export type ReportEvent = {
  data: StepData;
  indexStep: number;
  action: string;
  description: string;
  status: string;
  screenshot?: string;
  metadata?: { isHeadless?: boolean };
  isConditional?: boolean;
  time?: string;
  url?: string;
  typeAssert?: string;
  valueToAssert?: string;
  selectorString?: string;
  error?: string;
};

export type ReportFile = {
  events: ReportEvent[];
  type: string;
  id: string;
  timestamp: string;
  status: "passed" | "failed" | string;
  reportName: string;
};

export type FlowNode = {
    id: string;
    name: string;
    method: string;
    url: string;
    rawNode: any;
};

export type Detail = {
    key: string;
    uid: string;
    name: string;
    teamId: number | string;
    data: any;
};

export type Connector = { d: string };


export type Stage = "pre" | "request" | "post";
export type ModalTab = "metadata" | "error" | "environment";

export type ExecPiece = {
    name: string;
    request?: {
        success?: boolean;
        status?: number | null;
        detail?: any;
    };
    test?: {
        success?: boolean;
        detail?: any;
    };
};