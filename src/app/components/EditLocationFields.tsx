import React, { useEffect, useState } from "react";
import { SearchField } from "./SearchField";
import { useTagsModules } from "../hooks/useTagsModules";

interface TestCase {
  tagName?: string;
  moduleName?: string;
  subModuleName?: string;
}

interface Props {
  test: TestCase;
  onUpdate: (updatedFields: Partial<TestCase>) => void;
  visible: boolean;
}

const EditLocationFields: React.FC<Props> = ({ test, onUpdate, visible }) => {
  const {
    tags,
    modules,
    submodules,
    setSelectedTag,
    setSelectedModule,
    setSelectedSubmodule,
    isLoadingSubmodules,
  } = useTagsModules();

  const [localTag, setLocalTag] = useState(test.tagName ?? "");
  const [localModule, setLocalModule] = useState(test.moduleName ?? "");
  const [localSubmodule, setLocalSubmodule] = useState(test.subModuleName ?? "");

  useEffect(() => {
    setLocalTag(test.tagName ?? "");
    setLocalModule(test.moduleName ?? "");
    setLocalSubmodule(test.subModuleName ?? "");
  }, [test]);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2">
      <SearchField
        label="Tag"
        value={localTag}
        onChange={(val) => {
          setLocalTag(val);
          setLocalModule("");
          setLocalSubmodule("");

          setSelectedTag(val);
          setSelectedModule("");
          setSelectedSubmodule("");

          onUpdate({
            tagName: val,
            moduleName: "",
            subModuleName: "",
          });
        }}
        options={tags.map((tag) => ({ label: tag, value: tag }))}
        placeholder="Tag"
      />

      <SearchField
        label="Module"
        value={localModule}
        onChange={(val) => {
          setLocalModule(val);
          setLocalSubmodule("");

          setSelectedModule(val);
          setSelectedSubmodule("");

          onUpdate({
            tagName: localTag,
            moduleName: val,
            subModuleName: "",
          });
        }}
        options={modules.map((mod) => ({ label: mod, value: mod }))}
        placeholder="Module"
        disabled={!localTag}
      />

      <SearchField
        label="Submodule"
        value={localSubmodule}
        onChange={(val) => {
          setLocalSubmodule(val);
          setSelectedSubmodule(val);

          onUpdate({
            tagName: localTag,
            moduleName: localModule,
            subModuleName: val,
          });
        }}
        options={submodules.map((sub) => ({ label: sub, value: sub }))}
        placeholder="Submodule"
        disabled={!localModule || isLoadingSubmodules}
      />
    </div>
  );
};

export default EditLocationFields;
