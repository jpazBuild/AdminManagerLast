"use client"

import TextInputWithClearButton from "@/app/components/InputClear";
import { SearchField } from "@/app/components/SearchField";
import { DashboardHeader } from "@/app/Layouts/main";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useState } from "react";


const CollectionsPage = () => {
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedTypeOrigin, setSelectedTypeOrigin] = useState<string | null>(null);
    const [openCollection, setOpenCollection] = useState<Array<[string, boolean]>>([]);
    const typeOrigin = [
        { name: "Postman" },
        { name: "BD" }
    ];
    const teams = [
        { name: "Team A" },
        { name: "Team B" },
        { name: "Team C" },
    ];

    const listCollections = [
        { name: "Collection 1", team: "Team A", origin: "Postman" },
        { name: "Collection 2", team: "Team B", origin: "BD" },
        { name: "Collection 3", team: "Team C", origin: "Postman" },
        { name: "Collection 4", team: "Team A", origin: "BD" },
        { name: "Collection 5", team: "Team B", origin: "Postman" },
    ];

    return (
        <DashboardHeader pageType="api">
            <div className="min-h-screen py-2 flex flex-row">
                <div className="min-h-screen w-72 border border-primary/20 p-2 rounded-md fixed top-20
                    flex flex-col gap-4
                ">
                    <SearchField
                        label="From"
                        value={selectedTypeOrigin ?? ""}
                        onChange={setSelectedTypeOrigin}
                        placeholder="Search collections"
                        className="z-50"
                        options={typeOrigin?.map((tag: any) => ({
                            label: String(tag?.name),
                            value: String(tag?.name),
                        }))}
                    />

                    <SearchField
                        label="Team"
                        value={selectedTeam ?? ""}
                        onChange={setSelectedTeam}
                        placeholder="Search Team"
                        className="z-40"
                        options={teams?.map((tag: any) => ({
                            label: String(tag?.name),
                            value: String(tag?.name),
                        }))}
                    />
                    <span className="h-0.5 w-full bg-primary/20 self-center"></span>

                    <TextInputWithClearButton
                        id="collection-name"
                        label="Search Collections"
                        placeholder="Enter collection name"
                        value={selectedCollection ?? ""}
                        onChangeHandler={(e) => setSelectedCollection(e.target.value)}
                        isSearch={true}
                    />
                    {listCollections.length > 0 ? (
                        <div className="flex overflow-y-auto flex-col gap-2 h-full">
                            {
                                listCollections.map((collection, index) => {
                                    return (
                                        <>
                                            <div className="flex text-primary/80" onClick={() => setOpenCollection([[collection.name, true]])} key={index}>
                                                <ChevronRight className="w-5 h-5 text-primary" />
                                                <p>{collection.name}</p>

                                            </div>
                                            {openCollection.find(item => item[0] === collection.name && item[1] === true) && (
                                                <div className="ml-6 flex flex-col gap-1">
                                                    
                                                </div>
                                            )}
                                        </>


                                    )
                                })
                            }
                        </div>


                    ) : (
                        <p className="text-sm text-gray-500">There are no collections here.</p>
                    )

                    }

                </div>
            </div>


        </DashboardHeader>
    )
}
export default CollectionsPage;