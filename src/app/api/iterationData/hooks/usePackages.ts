import { useState } from "react";

export type Row = { variable: string; value: string };

export type Pkg = {
  id: string;
  name: string;
  description?: string;
  selected: boolean;
  rows: Row[];
  tagNames: string[];
  createdBy?: string;   
  tagIds?: string[];    
};

export function usePackages() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const genId = () =>
    typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function"
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const makeBlank = (n: number): Pkg => ({
    id: genId(),
    name: `Number${n}`,
    description: "",
    selected: true,
    rows: [{ variable: "", value: "" }],
    tagNames: [],
    createdBy: "",
    tagIds: [],
  });

  const addBlank = () => setPackages((prev) => [...prev, makeBlank(prev.length + 1)]);

  const addFromHeader = (
    id: string,
    name: string,
    description: string,
    rows: Row[],
    tagNames: string[] = [],
    createdBy?: string,
    tagIds?: string[]
  ) =>
    setPackages([
      {
        id,
        name,
        description,
        selected: true,
        rows: rows.length ? rows : [{ variable: "", value: "" }],
        tagNames,
        createdBy,
        tagIds,
      },
    ]);

  const duplicate = (pkg: Pkg) =>
    setPackages((prev) => [...prev, { ...pkg, id: genId(), name: pkg.name + " Copy" }]);

  const remove = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelected = (id: string) =>
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));

  const updateName = (id: string, name: string) =>
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));

  const updateDesc = (id: string, description: string) =>
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, description } : p)));

  const addRow = (id: string) =>
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rows: [...p.rows, { variable: "", value: "" }] } : p))
    );

  const delRow = (id: string, i: number) =>
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rows: p.rows.filter((_, k) => k !== i) } : p))
    );

  const updRow = (id: string, i: number, field: keyof Row, value: string) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, rows: p.rows.map((r, k) => (k === i ? { ...r, [field]: value } : r)) }
          : p
      )
    );

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addTag = (id: string, tag: string) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.id === id && !p.tagNames.includes(tag)
          ? { ...p, tagNames: [...p.tagNames, tag] }
          : p
      )
    );

  const removeTag = (id: string, tag: string) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, tagNames: p.tagNames.filter((t) => t !== tag) } : p
      )
    );

  return {
    packages,
    setPackages,
    collapsed,
    toggleCollapse,
    addBlank,
    addFromHeader,
    duplicate,
    remove,
    toggleSelected,
    updateName,
    updateDesc,
    addRow,
    delRow,
    updRow,
    addTag,
    removeTag,
  };
}
