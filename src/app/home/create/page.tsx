"use client";
import CardGlass from "@/app/components/cardGlass";
import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/DashboardLayout";
import { MdArrowBack } from "react-icons/md";
import Link from "next/link";
import TextInputWithClearButton from "@/app/components/InputClear";
import axios from "axios";
import { toast } from "sonner";
import { SearchField } from "@/app/components/SearchField";

const CreateForm = () => {
    const [createGroup, setCreateGroup] = useState(false);
    const [createTag, setCreateTag] = useState(false);
    const [createModule, setCreateModule] = useState(false);
    const [createSubmodule, setCreateSubmodule] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [createdByGroup, setCreatedByGroup] = useState("");
    const [groups, setGroups] = useState<string[]>([]);
    const [tagName, setTagName] = useState("");
    const [createdByTag, setCreatedByTag] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await axios.post("http://localhost:3003/local/groups", {});
                if (response.status === 200) {
                    setGroups(response.data);
                } else {
                    toast.error("Error fetching groups: " + response.data);
                }
            } catch (error) {
                console.error("Error fetching groups:", error);
                toast.error("Network or server error while fetching groups.");
            }
        }
        fetchGroups();
    }, [])

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return (): void => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    const createGroupHandler = async (groupName: string, createdByGroup: string) => {
        console.log("Creating group with name:", groupName);

        if (!groupName || !createdByGroup) {
            toast.error("Group name and 'created by' fields are required.");
            return;
        }

        try {
            const response = await axios.put("http://localhost:3003/local/groups", {
                name: groupName,
                createdBy: createdByGroup,
            });

            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Group created successfully!");
                console.log("Group created:", response.data);
            } else {
                toast.error("Error creating group: " + response.data);
            }
        } catch (error: any) {
            console.error("Error during group creation:", error);
            toast.error("Network or server error while creating group.");
        }
    };

    const createTagHandler = async () => {
        if (!tagName || !createdByTag) {
            toast.error("Tag name and created by fields are required.");
            return;
        }

        try {
            const response = await axios.put("http://localhost:3003/local/tags", {
                name: tagName,
                createdBy: createdByTag,
                group: selectedGroup || undefined,
            });

            if (response.status === 200 && !String(response.data).includes("Error")) {
                toast.success("Tag created successfully!");
            } else {
                toast.error("Error creating tag: " + response.data);
            }
        } catch (error: any) {
            console.error("Error creating tag:", error);
            toast.error("Network or server error while creating tag.");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-start h-full gap-6 px-4 py-8">
                <Link
                    href="/home"
                    className="flex self-start items-center gap-2 text-white/80 hover:text-white transition"
                >
                    <MdArrowBack className="w-5 h-5" />
                    <span>Back to Home</span>
                </Link>

                <CardGlass className="w-full max-w-2xl">
                    <h2 className="text-2xl font-bold mb-4 text-white text-center">
                        Create Entities
                    </h2>

                    <div className="flex flex-col gap-4 text-white">

                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={createGroup}
                                    className="accent-white checked:text-primary"
                                    onChange={() => setCreateGroup(!createGroup)}
                                />
                                Create Group
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={createTag}
                                    className="accent-white checked:text-primary"
                                    onChange={() => setCreateTag(!createTag)}
                                />
                                Create Tag
                            </label>
                             <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={createModule}
                                    className="accent-white checked:text-primary"
                                    onChange={() => setCreateModule(!createModule)}
                                />
                                Create Module
                            </label>
                             <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={createSubmodule}
                                    className="accent-white checked:text-primary"
                                    onChange={() => setCreateSubmodule(!createSubmodule)}
                                />
                                Create SubModule
                            </label>
                        </div>
                        {createGroup && (
                            <>
                                <TextInputWithClearButton
                                    id="groupName"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Enter Group Name"
                                    className="p-2 !bg-white/70 rounded-md"
                                    onChangeHandler={(e) => setGroupName(e.target.value)}
                                    value={""}
                                />
                                <TextInputWithClearButton
                                    id="createdByGroup"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Created By"
                                    className="p-2 !bg-white/70 rounded-md"
                                    onChangeHandler={(e) => setCreatedByGroup(e.target.value)}
                                    value={""}
                                />
                                <button
                                    onClick={() => createGroupHandler(groupName, createdByGroup)}
                                    className="cursor-pointer z-50 bg-slate-600 hover:bg-slate-700 shadow-md text-white py-2 px-4 rounded-md transition-colors"
                                >
                                    Save Group
                                </button>
                            </>


                        )}
                        {createTag && (
                            <>
                                <SearchField
                                    label="Related Group (optional)"
                                    value={selectedGroup}
                                    onChange={setSelectedGroup}
                                    options={groups?.map((group: any) => ({
                                        label: String(group.name),
                                        value: String(group.name),
                                    }))}
                                    placeholder="Select a group (optional)"
                                    darkMode={true}
                                    textColorLabel="text-white/90"
                                />

                                <TextInputWithClearButton
                                    id="tagName"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Enter Tag Name"
                                    className="p-2 !bg-primary/50 rounded-md text-white"
                                    onChangeHandler={(e) => setTagName(e.target.value)}
                                    value={tagName}
                                />

                                <TextInputWithClearButton
                                    id="createdByTag"
                                    type="text"
                                    inputMode="text"
                                    placeholder="Created By"
                                    className="p-2 !bg-primary/50  rounded-md text-white"
                                    onChangeHandler={(e) => setCreatedByTag(e.target.value)}
                                    value={createdByTag}
                                />

                                <button
                                    onClick={createTagHandler}
                                    className="cursor-pointer bg-[#101827] hover:bg-slate-700 shadow-md text-white py-2 px-4 rounded-md transition-colors"
                                >
                                    Save Tag
                                </button>
                            </>
                        )}

                        {/* 
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createTag}
                onChange={() => setCreateTag(!createTag)}
              />
              Create Tag
            </label>
            {createTag && (
              <TextInputWithClearButton
                id="tagName"
                type="text"
                inputMode="text"
                placeholder="Enter Tag Name"
                className="p-2 bg-white/80 text-black rounded-md"
                onChangeHandler={(e) => setSelectedTag(e.target.value)}
                value={selectedTag}
              />
            )}
            

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createModule}
                onChange={() => setCreateModule(!createModule)}
              />
              Create Module
            </label>

            {createModule && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="p-2 bg-white/80 text-black rounded-md"
              >
                <option value="">(Optional) Select related Tag</option>
                <option value="tag1">Tag 1</option>
                <option value="tag2">Tag 2</option>
              </select>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createSubmodule}
                onChange={() => setCreateSubmodule(!createSubmodule)}
              />
              Create Submodule
            </label>

            {createSubmodule && (
              <select
                required
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="p-2 bg-white/80 text-black rounded-md"
              >
                <option value="">Select a Module (required)</option>
                <option value="module1">Module 1</option>
                <option value="module2">Module 2</option>
              </select>
            )} */}


                        {/*list of groups*/}

                    </div>
                </CardGlass>
            </div>
        </DashboardLayout>
    );
};

export default CreateForm;

