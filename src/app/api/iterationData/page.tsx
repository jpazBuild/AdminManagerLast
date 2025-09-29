"use client"

import TextInputWithClearButton from "@/app/components/InputClear";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import iterationDataEmptyState from "../../../assets/apisImages/select-iterationData.svg";



const IterationDataPage = () => {
    const [iterationData, setIterationData] = useState<any[]>([]);
    const [openIteration, setOpenIteration] = useState<string | null>(null);
    const [itemSelected, setItemSelected] = useState<any>(null);
    useEffect(() => {
        const fetchIterationData = async () => {

            try {
                const response = await axios.post(`${URL_API_ALB}getIterationDataHeaders`, {})
                setIterationData(response.data);
            } catch (error) {
                console.error("Error fetching iteration data", error);
            }
        }

        fetchIterationData();
    }, [])

    useEffect(()=>{
        const fetchItemDetails = async () => {
            if(!openIteration) return;
            try {
                const response = await axios.post(`${URL_API_ALB}iterationData`, { id: openIteration })
                setItemSelected(response.data);
            } catch (error) {
                console.error("Error fetching iteration item details", error);
            }
        }

        fetchItemDetails();
    }, [openIteration])

    //{"iteration1":{"personal_username":"automationqa"},"iteration2":{"personal_username":"automationjc"}} and i want render it nicely
    //inside a box with a border and a title with the name of the iteration data

    console.log("selected", itemSelected);
    

    return (
        <DashboardHeader pageType="api">
            {iterationData.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center text-slate-500">
                    <Image
                        src={iterationDataEmptyState}
                        alt="Select iteration data"
                        className="h-20 w-auto rounded-md p-2 mb-2"
                    />

                    <h2 className="text-xl font-semibold mt-6 mb-2 text-center">Create data packages</h2>
                    <p className="text-muted-foreground mb-6 text-center">To use in your iterations</p>
                    <div className="flex gap-4">
                        <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium">New package</button>
                        <button className="border border-primary px-6 py-2 rounded-lg font-medium">Upload CSV</button>
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="text-2xl font-bold text-primary/80">Iteration Data</h1>
                    <div className="flex flex-col gap-2 mt-4">
                        {iterationData.map((item) => {
                            return (
                                <div key={item.id}>
                                    <div className="p-4 border border-primary/20 rounded-md" key={item.id} onClick={() => setOpenIteration(openIteration === item.id ? null : item.id)}>
                                        <h2 className="text-lg font-bold">{item.name}</h2>
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                    </div>
                                    {openIteration === item.id && (
                                        <div className="mt-2 p-4 border border-primary/30 rounded-md bg-primary/5">
                                            {itemSelected && itemSelected.iterationData && itemSelected.iterationData.length > 0 && (
                                                <>
                                                    {itemSelected.iterationData.map((dataItem: any, index: number) => (
                                                        <div key={index} className="p-2 border-b border-primary/20">
                                                            <span className="text-[14px] text-primary/70 bg-primary/20 p-1 rounded-md">{dataItem.id}</span>
                                                            <h3 className="font-bold">{dataItem.apisScriptsName}</h3>
                                                            <div className="mt-2 p-2 border border-primary/20 rounded-md">
                                                                {Object.entries(dataItem.iterationData).map(([key, value]) => (
                                                                    <div key={key} className="flex flex-col justify-between" id={`${dataItem.id}-${key}`}>
                                                                        <span className="font-medium">{key}:</span>
                                                                        {typeof value === 'object' && value !== null && (
                                                                            <>
                                                                                {Object.entries(value).map(([subKey, subValue]) => (
                                                                                    <div key={subKey} className="flex justify-between ml-4" id={`${dataItem.id}-${key}-${subKey}`}>
                                                                                        <TextInputWithClearButton
                                                                                            label={subKey}
                                                                                            placeholder=""
                                                                                            id={`${dataItem.id}-${key}-${subKey}`}
                                                                                            type="text"
                                                                                            value={JSON.stringify(subValue)}
                                                                                            readOnly
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </DashboardHeader>
    )
}

export default IterationDataPage;