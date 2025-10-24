export type IterationHeader = {
  id: string;
  name: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
};

export type Row = { id: string; variable: string; value: string };

export type IterBlock = {
  id: string;        // UI id
  label: string;     // “Tag 1”, “Tag 2”, etc
  rows: Row[];       // pares variable/value de esa iteración
};

export type DetailResponse = {
  id: string;
  name: string;
  description?: string;
  tagNames?: string[];
  tagIds?: string[];
  createdAt?: number;
  createdBy?: string;
  createdByName?: string;
  type?: string;
  route?: string;
  iterationData: Array<{
    id?: string;
    apisScriptsName?: string;
    iterationCount?: number;
    iterationData: Record<string, unknown>;
    order?: number;
    createdBy?: string;
  }>;
};
