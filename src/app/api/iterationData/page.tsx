"use client"

import TextInputWithClearButton from "@/app/components/InputClear";
import { DashboardHeader } from "@/app/Layouts/main";
import { URL_API_ALB } from "@/config";
import axios from "axios";
import { useEffect, useState } from "react";


const IterationDataPage = () => {
    const [iterationData, setIterationData] = useState<any[]>([]);
    const [openIteration, setOpenIteration] = useState<string | null>(null);
    const [itemSelected, setItemSelected] = useState<any>(null);

    const [openNewPackage, setOpenNewPackage] = useState(false);

    useEffect(() => {
        const fetchIterationData = async () => {

            try {
                const response = await axios.post(`${URL_API_ALB}getIterationDataHeaders`, {})
                setIterationData(response.data);
                // setIterationData([]);
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
    

    return (
        <DashboardHeader pageType="api">
            <div className="flex flex-col gap-2 mt-4">
                <h1 className="text-2xl font-bold text-primary/80">Iteration Data</h1>

                {iterationData.length > 0 && iterationData.map((item) => {
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
                                                            <div key={key} className="flex flex-col justify-between gap-2" id={`${dataItem.id}-${key}`}>
                                                                <span className="font-medium">{key}:</span>
                                                                {typeof value === 'object' && value !== null && (
                                                                    <div className="flex flex-col gap-2">
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
                                                                    </div>
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

                {iterationData.length === 0 && (
                    <p className="text-gray-500">No iteration data available.</p>
                )}

                {!openNewPackage &&(
                    <button
                        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                        onClick={() => setOpenNewPackage(true)}
                    >
                        New Package
                    </button>
                )}

                {openNewPackage && (
                    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-lg w-96">
                            <h2 className="text-xl font-bold mb-4">New Package</h2>
                            {/* Form fields for new package */}
                        </div>
                        <button onClick={() => setOpenNewPackage(false)}>
                            Close
                        </button>
                    </div>
                )}
            </div>
        </DashboardHeader>
    )
}

export default IterationDataPage;