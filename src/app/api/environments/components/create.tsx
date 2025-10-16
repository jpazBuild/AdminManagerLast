import TextInputWithClearButton from "@/app/components/InputClear";
import { useState } from "react";
import { EnvRow } from "../types/types";
import axios from "axios";
import { URL_API_ALB } from "@/config";
import { PlusIcon, X } from "lucide-react";
import useTags from "../../hooks/useTags";
import { SearchField } from "@/app/components/SearchField";
import { Tag } from "@/types/types";


interface CreateEnvironmentProps {
    setToastError: (msg: string | null) => void;
    setCreateView: (view: boolean) => void;
    setToastMsg: (msg: string | null) => void;
    setRefetchEnvironments: (refetch: boolean) => void;
}


const CreateEnvironment = ({ setToastError, setCreateView, setToastMsg, setRefetchEnvironments }: CreateEnvironmentProps) => {
    const [nameCreated, setNameCreated] = useState<{ name: string; description: string }>({ name: "", description: "" });
    const { tags, isLoadingTags, error, refresh } = useTags();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string>("");
    const makeRowId = () => String(Date.now() + Math.random());

    const makeEmptyRow = (): EnvRow => ({
        id: makeRowId(),
        key: "",
        value: "",
        enabled: true,
        _orig: { key: "", value: "", enabled: true },
    });
    const [createRows, setCreateRows] = useState<EnvRow[]>([makeEmptyRow()]);
    const createAllEnabled = createRows.length > 0 && createRows.every(r => r.enabled);
    const createToggleAll = () =>
        setCreateRows(prev => prev.map(r => ({ ...r, enabled: !createAllEnabled })));

    const createUpdateRow = (id: string, patch: Partial<EnvRow>) =>
        setCreateRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));

    const createToggleRowEnabled = (id: string) =>
        setCreateRows(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

    const createAddRow = () =>
        setCreateRows(prev => [...prev, makeEmptyRow()]);

    const createRemoveRow = (id: string) =>
        setCreateRows(prev => prev.filter(r => r.id !== id));


    const handlecreate = async () => {
        if (!nameCreated.name?.trim()) {
            setToastError("Environment name cannot be empty.");
            setTimeout(() => setToastError(null), 4000);
            return;
        }

        const envObj: Record<string, any> = {};
        createRows
            .filter(r => r.enabled && r.key.trim().length > 0)
            .forEach(r => { envObj[r.key.trim()] = r.value; });

        try {
            const response = await axios.put(`${URL_API_ALB}envs`, {
                name: nameCreated.name.trim(),
                tagNames: [
                    ...selectedTags,
                    ...(selectedTag ? [selectedTag] : [])
                ],
                description: nameCreated.description.trim(),
                env: envObj,
                createdBy: "jpaz",
                updatedBy: "jpaz",
                temp: false,
            });
            if (response.status !== 200) throw new Error("Error creating environment");
            setCreateRows([makeEmptyRow()]);
            setCreateView(false);
            setRefetchEnvironments(true);
            setToastMsg("Environment created successfully.");
            setTimeout(() => setToastMsg(null), 4000);

        } catch (e) {
            setToastError("Error while creating environment.");
            setTimeout(() => setToastError(null), 4000);
        }
    }
    return (
        <div className="w-full h-full bg-white flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-full h-full ">
                <div className="flex flex-col items-center gap-4 w-full">
                    <h2 className="text-xl font-semibold text-primary/85">Create New Environment</h2>

                    <TextInputWithClearButton
                        id="new-env-name"
                        label="Environment Name"
                        value={nameCreated.name}
                        placeholder="Enter environment name"
                        onChangeHandler={(e) =>
                            setNameCreated({ ...nameCreated, name: e.target.value })
                        }
                    />
                    <TextInputWithClearButton
                        id="new-env-description"
                        label="Description"
                        value={nameCreated.description}
                        placeholder="Enter description"
                        onChangeHandler={(e) =>
                            setNameCreated({ ...nameCreated, description: e.target.value })
                        }
                    />
                    <SearchField
                        label="Tags"
                        placeholder="Search tags"
                        value={selectedTag}
                        onChange={(val: string) => {
                            setSelectedTag(val);
                        }}
                        options={tags
                            .filter((t: string | Tag) => !selectedTags.includes(t.toString()))
                            .map(tag => ({
                                label: typeof tag === "string" ? tag : tag.name ?? "",
                                value: typeof tag === "string" ? tag : tag.name ?? ""
                            }))
                        }
                    />
                </div>

                <div className="mt-4 flex flex-col w-full h-full overflow-y-auto">
                    <div className="flex flex-col w-full h-full overflow-y-auto px-6">
                        <div className="grid grid-cols-[28px_1fr_1fr_40px] gap-3 py-2 text-xs text-gray-500">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    aria-label="Toggle all"
                                    checked={createAllEnabled}
                                    onChange={createToggleAll}
                                    className="h-4 w-4 accent-primary"
                                />
                            </div>
                            <div className="uppercase tracking-wider">Variable</div>
                            <div className="uppercase tracking-wider">Value</div>
                            <div />
                        </div>

                        <div className="h-full w-full flex flex-col gap-2 overflow-y-auto my-auto overflow-x-hidden">
                            {createRows.map((r) => (
                                <div
                                    key={r.id}
                                    className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 items-center rounded-lg hover:bg-primary/5"
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-primary"
                                            checked={r.enabled}
                                            onChange={() => createToggleRowEnabled(r.id)}
                                        />
                                    </div>

                                    <TextInputWithClearButton
                                        id={`env-key-${r.id}`}
                                        label=""
                                        value={r.key}
                                        placeholder="KEY"
                                        onChangeHandler={(e) => createUpdateRow(r.id, { key: e.target.value })}
                                        isSearch={false}
                                    />

                                    <TextInputWithClearButton
                                        id={`env-value-${r.id}`}
                                        label=""
                                        value={r.value}
                                        placeholder="VALUE"
                                        onChangeHandler={(e) => createUpdateRow(r.id, { value: e.target.value })}
                                    />

                                    <button
                                        className="p-2 rounded hover:bg-gray-100"
                                        aria-label="Remove row"
                                        title="Remove"
                                        onClick={() => createRemoveRow(r.id)}
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            ))}

                            <div className="mt-2 flex justify-between">
                                <button
                                    className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 flex gap-2 items-center"
                                    onClick={createAddRow}
                                >
                                    <PlusIcon className="w-5 h-5"/> Add variable
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                                        onClick={() => {
                                            setCreateView(false);
                                            setCreateRows([makeEmptyRow()]);
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="cursor-pointer px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90"
                                        onClick={handlecreate}
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default CreateEnvironment;