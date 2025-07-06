"use client";
import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import TextInputWithClearButton from "./InputClear";
import CopyToClipboard from "./CopyToClipboard";
import DeleteButton from "./DeleteButton";
import React, { useCallback, useMemo } from 'react';
import { Copy, Save, Trash2 } from "lucide-react";
import { FaXmark } from "react-icons/fa6";

interface InteractionItemData {
    id: string;
    action: string;
    [key: string]: any;
}

interface InteractionItemProps {
    data: InteractionItemData;
    index: number;
    isContext?: boolean;
    onDelete?: (index: number) => void;
    onUpdate?: (index: number, updatedData: InteractionItemData) => void;
}




interface JSONBoxProps {
    value: any;
    onChange?: (value: any) => void;
}

interface PanelState {
    [key: string]: boolean;
}

interface DisplayImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt?: string;
}


function DisplayImageWithFetch({
    src,
    alt,
    ...props
}: {
    src: string;
    alt?: string;
    [key: string]: any;
}) {
    const [isError, setIsError] = React.useState(false);

    React.useEffect(() => {
        setIsError(false); // reset error when src changes
    }, [src]);

    if (!src || isError) {
        // SVG clásico "imagen no disponible"
        return (
            <div className="flex flex-col items-center justify-center bg-gray-100 px-3 py-4 rounded-md max-h-32 min-h-[6rem] min-w-[8rem]">
                <svg
                    className="w-10 h-10 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="#e5e7eb"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#cbd5e1" />
                    <path d="M21 17l-5-5-7 7" stroke="#94a3b8" strokeWidth={2} />
                </svg>
                <span className="text-xs text-gray-400 break-all">
                    Image no available
                </span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || "Imagen"}
            onError={() => setIsError(true)}
            className="max-h-32 w-auto rounded-md shadow-sm"
            {...props}
        />
    );
}







const JSONBox: React.FC<JSONBoxProps> = ({ value, onChange }) => {
    const [openPanels, setOpenPanels] = useState<PanelState>({});
    const [editingJson, setEditingJson] = useState(false);
    const [jsonValue, setJsonValue] = useState(JSON.stringify(value, null, 2));
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        if (!editingJson) setJsonValue(JSON.stringify(value, null, 2));
    }, [value, editingJson]);

    function handleSave() {
        try {
            const parsed = JSON.parse(jsonValue);
            setJsonError(null);
            setEditingJson(false);
            onChange?.(parsed); // Propaga el nuevo objeto hacia arriba
        } catch (err: any) {
            setJsonError("Invalid JSON: " + err.message);
        }
    }
    const togglePanel = useCallback((name: string) => {
        setOpenPanels(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    }, []);

    const DropdownHeader = useCallback(({ label, panelKey }: { label: string; panelKey: string }) => (
        <div
            className="flex justify-between items-center bg-white cursor-pointer rounded-md border-l-6 border-primary p-2 hover:bg-primary/10 transition-colors"
            onClick={() => togglePanel(panelKey)}
        >
            <span className="text-primary/80 font-semibold">{label}</span>
            {openPanels[panelKey] ?
                <FaChevronUp className="text-primary" /> :
                <FaChevronDown className="text-primary" />
            }
        </div>
    ), [openPanels, togglePanel]);

    const updateNestedData = useCallback((path: string[], newValue: any) => {
        if (!onChange) return;

        const updatedValue = { ...value };
        let current = updatedValue;

        for (let i = 0; i < path.length - 1; i++) {
            current[path[i]] = { ...current[path[i]] };
            current = current[path[i]];
        }

        current[path[path.length - 1]] = newValue;
        onChange(updatedValue);
    }, [value, onChange]);

    const deleteNestedProperty = useCallback((path: string[]) => {
        if (!onChange) return;

        const updatedValue = { ...value };
        let current = updatedValue;

        for (let i = 0; i < path.length - 1; i++) {
            current[path[i]] = { ...current[path[i]] };
            current = current[path[i]];
        }

        delete current[path[path.length - 1]];
        onChange(updatedValue);
    }, [value, onChange]);

    const FieldEditor = useCallback(({
        label,
        fieldValue,
        onUpdate,
        onDelete
    }: {
        label: string;
        fieldValue: any;
        onUpdate: (newValue: string) => void;
        onDelete: () => void;
    }) => (
        <div className="flex flex-col gap-2 mb-3 p-2 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between w-full">
                <span className="text-xs text-gray-600 font-medium">{label}:</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigator.clipboard.writeText(String(fieldValue))}
                        className="text-xs cursor-pointer text-primary/70 px-2 py-1 rounded transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-xs cursor-pointer  text-primary/70 px-2 py-1 rounded transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <TextInputWithClearButton
                id={label}
                value={String(fieldValue)}
                onChangeHandler={(e) => onUpdate(e.target.value)}
                placeholder={label}
                className="w-full px-3 py-2 border border-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

            />
        </div>
    ), []);

    const processedData = useMemo(() => {
        if (!value) return null;

        return {
            hasNavigation: value.action === "navigate",
            hasContext: value.context,
            hasSelectors: value?.data?.selectors?.length > 0,
            hasAttributes: Object.keys(value?.data?.attributes || {}).length > 0,
            hasCoordinates: value?.data?.coordinates && Object.keys(value.data.coordinates).length > 0,
            hasImage: value?.data?.image,
            hasText: value?.data?.text || value?.text,
            hasTimeStamp: value?.data?.timeStamp,
            hasPageIndex: value?.pageIndex !== undefined,
            hasIndexStep: value?.indexStep !== undefined,
            hasTypeToAssert: value?.typeAssert !== undefined,
            hasValueToAssert: value?.valueToAssert !== undefined,

        };
    }, [value]);

    if (!value || !processedData) {
        return <div className="text-gray-500 text-center p-4">No data available</div>;
    }

    return (
        <div className="rounded-lg shadow-lg bg-white overflow-hidden">
            <DropdownHeader label="Show Options" panelKey="showOptions" />

            {openPanels.showOptions && (
                <div className="p-1 space-y-4">
                    {processedData.hasNavigation && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <DropdownHeader label="Navigate Data" panelKey="navigateData" />
                            {openPanels.navigateData && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(value.data)
                                        .filter(([key]) => key !== "pageSize")
                                        .map(([key, val]) => (
                                            <FieldEditor
                                                key={key}
                                                label={key}
                                                fieldValue={val}
                                                onUpdate={(newValue) => updateNestedData(['data', key], newValue)}
                                                onDelete={() => deleteNestedProperty(['data', key])}
                                            />
                                        ))}

                                    {/* Page Size */}
                                    {value.data.pageSize && Object.entries(value.data.pageSize).map(([key, val]) => (
                                        <FieldEditor
                                            key={`pageSize-${key}`}
                                            label={`Page Size - ${key}`}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(['context', 'data', 'window', key], newValue)}
                                            onDelete={() => deleteNestedProperty(['context', 'data', 'window', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasContext && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <DropdownHeader label="Context" panelKey="context" />
                            {openPanels.context && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(value.context.data)
                                        .filter(([key]) => key !== "window")
                                        .map(([key, val]) => (
                                            <FieldEditor
                                                key={key}
                                                label={key}
                                                fieldValue={val}
                                                onUpdate={(newValue) => updateNestedData(['context', key], newValue)}
                                                onDelete={() => deleteNestedProperty(['context', key])}
                                            />
                                        ))}

                                    {/* Window data */}
                                    {value.context.data.window && Object.entries(value.context.data.window).map(([key, val]) => (
                                        <FieldEditor
                                            key={`window-${key}`}
                                            label={`Window - ${key}`}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(['context', 'data', 'window', key], newValue)}
                                            onDelete={() => deleteNestedProperty(['context', 'data', 'window', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasSelectors && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <DropdownHeader label="Selectors" panelKey="selectors" />
                            {openPanels.selectors && (
                                <div className="p-4 space-y-3">
                                    {value.data.selectors.map((selector: any, idx: number) => (
                                        <FieldEditor
                                            key={idx}
                                            label={selector.type}
                                            fieldValue={selector.locator}
                                            onUpdate={(newValue) => {
                                                const updatedSelectors = [...value.data.selectors];
                                                updatedSelectors[idx].locator = newValue;
                                                updateNestedData(['data', 'selectors'], updatedSelectors);
                                            }}
                                            onDelete={() => {
                                                const updatedSelectors = value.data.selectors.filter((_: any, index: number) => index !== idx);
                                                updateNestedData(['data', 'selectors'], updatedSelectors);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasAttributes && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <DropdownHeader label="Attributes" panelKey="attributes" />
                            {openPanels.attributes && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(value.data.attributes).map(([key, val]) => (
                                        <FieldEditor
                                            key={key}
                                            label={key}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(['data', 'attributes', key], newValue)}
                                            onDelete={() => deleteNestedProperty(['data', 'attributes', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasCoordinates && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <DropdownHeader label="Coordinates" panelKey="coordinates" />
                            {openPanels.coordinates && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(value.data.coordinates).map(([key, val]) => (
                                        <FieldEditor
                                            key={key}
                                            label={key}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(['data', 'coordinates', key], newValue)}
                                            onDelete={() => deleteNestedProperty(['data', 'coordinates', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasImage && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <DropdownHeader label="Image" panelKey="image" />
                            {openPanels.image && (
                                <DisplayImageWithFetch src={value.data.image} alt="Interaction Image" />
                            )}

                        </div>
                    )}

                    {processedData.hasTypeToAssert && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <FieldEditor
                                label="Type to Assert"
                                fieldValue={value?.typeAssert}
                                onUpdate={(newValue) => updateNestedData(['typeAssert'], newValue)}
                                onDelete={() => deleteNestedProperty(['typeAssert'])}
                            />
                        </div>
                    )}

                    {processedData.hasValueToAssert && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <FieldEditor
                                label="Value to Assert"
                                fieldValue={value?.valueToAssert}
                                onUpdate={(newValue) => updateNestedData(['valueToAssert'], newValue)}
                                onDelete={() => deleteNestedProperty(['valueToAssert'])}
                            />
                        </div>
                    )}

                    {processedData.hasText && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <FieldEditor
                                label="Text"
                                fieldValue={value.data.text || value.text}
                                onUpdate={(newValue) => updateNestedData(['data', 'text'], newValue)}
                                onDelete={() => deleteNestedProperty(['data', 'text'])}
                            />
                        </div>
                    )}

                    {processedData.hasTimeStamp && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <FieldEditor
                                label="Timestamp"
                                fieldValue={value?.data?.timeStamp}
                                onUpdate={(newValue) => updateNestedData(['timestamp'], newValue)}
                                onDelete={() => deleteNestedProperty(['timestamp'])}
                            />
                        </div>
                    )}

                    {processedData.hasPageIndex && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <FieldEditor
                                label="Page Index"
                                fieldValue={value?.pageIndex}
                                onUpdate={(newValue) => updateNestedData(['data', 'pageIndex'], newValue)}
                                onDelete={() => deleteNestedProperty(['data', 'pageIndex'])}
                            />
                        </div>
                    )}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <DropdownHeader label="JSON Preview" panelKey="jsonPreview" />
                        {/* {openPanels.jsonPreview && (
                            <div className="p-4">
                                <pre className="bg-primary/20 text-primary p-4 rounded-md overflow-auto text-xs font-mono max-h-64">
                                    <code>{JSON.stringify(value, null, 2)}</code>
                                </pre>
                            </div>
                        )} */}

                        {openPanels.jsonPreview && (
                            <div className="pt-2">
                                {!editingJson ? (
                                    <>
                                        <pre className="bg-primary/20 text-primary p-2 rounded-md overflow-auto text-xs font-mono max-h-64">
                                            <code>{jsonValue}</code>
                                        </pre>
                                        <button
                                            className="flex items-center gap-1 mt-2 px-3 py-1 rounded bg-primary/10 text-primary text-md hover:bg-primary/20"
                                            onClick={() => setEditingJson(true)}
                                        >
                                            <FaEdit className="w-4 h-4"/> Edit JSON
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <textarea
                                            className="focus:outline-none focus:ring-0 focus:border-primary w-full p-3 rounded-md bg-primary/20 border border-primary/20 font-mono text-xs text-primary min-h-[180px] max-h-64"
                                            value={jsonValue}
                                            onChange={e => setJsonValue(e.target.value)}
                                            autoFocus
                                            spellCheck={false}
                                        />
                                        {jsonError && (
                                            <div className="text-red-600 text-md mt-1">{jsonError}</div>
                                        )}
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                className="flex items-center gap-1 px-3 py-1 text-md rounded bg-primary text-white hover:bg-primary/90"
                                                onClick={handleSave}
                                            >
                                                <Save className="w-4 h-4"/> Save
                                            </button>
                                            <button
                                                className="flex items-center gap-1 px-3 py-1 text-md rounded bg-gray-200 text-primary hover:bg-gray-300"
                                                onClick={() => {
                                                    setJsonValue(JSON.stringify(value, null, 2));
                                                    setEditingJson(false);
                                                    setJsonError(null);
                                                }}
                                            >
                                               <FaXmark className="w-4 h-4"/> Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const InteractionItem = ({ data, index, onDelete, onUpdate }: InteractionItemProps) => {
    return (
        <div key={data.id} data-index={index} className="flex flex-col gap-4">
            <div className="relative flex flex-col gap-2 py-2 px-1 text-primary rounded-md border-l-4 border-primary shadow-lg transition-all duration-300">
                <div className="flex justify-center items-center w-full">
                    <div className="flex flex-col">
                        <p className="font-semibold text-center">{data.action}</p>
                        <p className="font-normal text-center">{data?.data?.text || data?.data?.attributes?.name || data?.data?.attributes?.placeholder || data?.data?.attributes?.["aria-label"]}</p>
                    </div>
                    <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md">
                        {data.indexStep}
                    </div>

                    <div className="absolute top-0 right-0 flex gap-2">
                        {onDelete && (
                            <DeleteButton onClick={() => onDelete(index)} />
                        )}
                        <CopyToClipboard text={JSON.stringify(data)} />
                    </div>
                </div>

                <JSONBox value={data} onChange={(newData) => {
                    onUpdate?.(index, newData);
                }} />
            </div>
        </div>
    );
};


export default InteractionItem;

// const [isSelectorsExpanded, setIsSelectorsExpanded] = useState(false);
// const [isAttributesExpanded, setIsAttributesExpanded] = useState(false);
// const [isContextExpanded, setIsContextExpanded] = useState(false);
// const [isContextGeneralExpanded, setIsContextGeneralExpanded] = useState(false);
// const [isCoordinatesExpanded, setIsCoordinatesExpanded] = useState(false);
// const [isConditionalAssertExpanded, setIsConditionalAssertExpanded] = useState(false);
// const [isSelectorConditionalAssertExpanded, setIsSelectorConditionalAssertExpanded] = useState(false);
// const [isAttributesConditionalAssertExpanded, setIsAttributesConditionalAssertExpanded] = useState(false);
// const [selectors, setSelectors] = useState<any>();
// const [attributes, setAttributes] = useState<any>();
// const [context, setContext] = useState<any>();
// const [contextGeneral, setContextGeneral] = useState<any>();
// const [updatedData, setUpdatedData] = useState<any>();
// const [coordinates, setCoordinates] = useState<any>();
// const [isDropdownOpen, setIsDropdownOpen] = useState(false);
// const [remainingFields, setRemainingFields] = useState<any>({});
// const [conditionalAssert, setConditionalAssert] = useState<any>();
// const [expandedOperations, setExpandedOperations] = useState<{ [key: number]: boolean }>({});

// useEffect(() => {

//     if (Object?.keys(value?.data).includes("selectors")) {
//         setSelectors(value?.data?.selectors);
//     }
//     if (Object?.keys(value?.data).includes("attributes")) {
//         setAttributes(value?.data?.attributes);
//     }
//     if (Object?.keys(value).includes("context")) {
//         setContext(value?.context);
//     }
//     if (value?.action === "navigate") {
//         setContextGeneral(value.data);
//     }
//     if (value.action === "assert" && Object.keys(value).includes("conditionalElement")) {
//         setConditionalAssert(value?.conditionalElement);
//     }

//     const updatedData = {
//         ...value,
//         context: undefined,
//         action: undefined,
//         data: {
//             ...value?.data,
//             selectors: undefined,
//             attributes: undefined,
//         }
//     };

//     const flattenedData = {
//         ...updatedData,
//         ...updatedData?.data,
//     };

//     const remainingFields = {
//         ...flattenedData,
//         ...flattenedData.data,
//     };

//     delete remainingFields.data;
//     delete remainingFields.indexStep;
//     delete remainingFields.action;
//     delete remainingFields.selectors;
//     delete remainingFields.attributes;
//     delete remainingFields.coordinates;
//     delete remainingFields.context;
//     delete remainingFields.conditionalElement;
//     setRemainingFields(remainingFields);

//     delete flattenedData?.data;
//     delete flattenedData?.indexStep;
//     if (value.action === "navigate") {
//         setUpdatedData(undefined)
//     } else {
//         setUpdatedData(flattenedData)

//     }
//     if (flattenedData?.coordinates && Object.keys(flattenedData?.coordinates)?.length > 0) {
//         setCoordinates(flattenedData?.coordinates);
//     }

// }, [value]);
// const toggleOperationExpand = (idx: number) => {
//     setExpandedOperations((prev) => ({
//         ...prev,
//         [idx]: !prev[idx],
//     }));
// };

// const toggleSelectorsExpand = () => setIsSelectorsExpanded(!isSelectorsExpanded);
// const toggleAttributesExpand = () => setIsAttributesExpanded(!isAttributesExpanded);
// const toggleContextExpand = () => setIsContextExpanded(!isContextExpanded);
// const toggleContextGeneralExpand = () => setIsContextGeneralExpanded(!isContextGeneralExpanded);
// const toggleCoordinatesExpand = () => setIsCoordinatesExpanded(!isCoordinatesExpanded);

// const toggleConditionalAssertExpand = () => setIsConditionalAssertExpanded(!isConditionalAssertExpanded);
// const toggleSelectorsConditionalAssertExpand = () => setIsSelectorConditionalAssertExpanded(!isSelectorConditionalAssertExpanded);
// const toggleAttributesConditionalAssertExpand = () => setIsAttributesConditionalAssertExpanded(!isAttributesConditionalAssertExpanded);


// const renderSelectors = (selectors: any[], onChange?: (updated: any[]) => void) => {
//     const moveSelector = (fromIdx: number, toIdx: number) => {
//         if (toIdx < 0 || toIdx >= selectors.length) return;
//         const updated = [...selectors];
//         const [movedItem] = updated.splice(fromIdx, 1);
//         updated.splice(toIdx, 0, movedItem);
//         onChange?.(updated);
//     };

//     return selectors?.map((selector, idx) => {
//         const handleChange = (newValue: string) => {
//             const updated = [...selectors];
//             updated[idx] = { ...selector, locator: newValue };
//             onChange?.(updated);
//         };

//         return (
//             <div key={idx} className="py-2 px-3 rounded-b-md bg-white">
//                 <div className="py-2 px-3 rounded-md flex flex-col w-full items-center gap-2">
//                     <div className="w-full flex justify-between items-center">
//                         <span className="text-xs text-primary/80">{selector?.type}</span>

//                         <div className="flex items-center gap-2">
//                             <button
//                                 className="text-xs px-2 py-1 border rounded"
//                                 disabled={idx === 0}
//                                 onClick={() => moveSelector(idx, idx - 1)}
//                                 title="Mover arriba"
//                             >
//                                 <ArrowUp className="h-4 w-4" />
//                             </button>
//                             <button
//                                 className="text-xs px-2 py-1 border rounded"
//                                 disabled={idx === selectors.length - 1}
//                                 onClick={() => moveSelector(idx, idx + 1)}
//                                 title="Mover abajo"
//                             >
//                                 <ArrowDown className="h-4 w-4" />
//                             </button>

//                             <DeleteButton
//                                 onClick={() => {
//                                     const updated = selectors.filter((_, index) => index !== idx);
//                                     onChange?.(updated);
//                                 }}
//                             />
//                             <CopyToClipboard text={selector?.locator !== null && selector?.locator !== undefined ? String(selector?.locator) : ""} />
//                         </div>
//                     </div>

//                     <TextInputWithClearButton
//                         id={selector?.locator}
//                         value={selector?.locator}
//                         onChangeHandler={(e) => handleChange(e.target.value)}
//                         placeholder="locator"
//                     />
//                 </div>
//             </div>
//         );
//     });
// };

// const renderAttributes = (attributes: any, isOptionExpanded: boolean,
//     onChange?: (updated: any) => void
// ) => {
//     console.log("attributes in renderAttributes:", attributes);

//     if (!attributes || Object.keys(attributes)?.length === 0) {
//         return null;
//     }
//     return Object.entries(attributes).map(([key, value], idx) => {
//         if (value === undefined) return null;

//         const handleChange = (newValue: any) => {
//             const updated = { ...attributes, [key]: newValue };
//             onChange?.(updated);
//         };

//         if (typeof value === "string" && value.startsWith("data:image")) {
//             console.log("Rendering image for key:", key, "with value:", value);

//             return (
//                 <div key={idx} className="py-2 px-3  rounded-b-md text-primary/80">
//                     <div className="w-full py-2 px-3  rounded-md flex flex-col items-center gap-2">
//                         <span className="self-start">Image</span>
//                         <Image src={value} alt={key} width={500} height={500} className="max-h-32 w-auto" />
//                     </div>
//                 </div>
//             );
//         }

//         return (
//             <div key={idx} className="py-2 px-3  rounded-b-md">
//                 <div className="w-full py-2 px-3 rounded-md flex flex-col items-center gap-2">
//                     <div className="w-full flex justify-between items-center">
//                         <div className="w-full text-xs text-primary/60">{key}</div>
//                         <CopyToClipboard text={value !== null && value !== undefined ? String(value) : ""} />

//                     </div>
//                     {typeof value === "string" || typeof value === "number" ? (
//                         <TextInputWithClearButton
//                             id={String(value)}
//                             value={String(value)}
//                             onChangeHandler={(e) => handleChange(e?.target?.value)}
//                             placeholder={String(value)}
//                         />
//                     ) : typeof value === "boolean" ? (
//                         <select
//                             className="bg-transparent border border-primary/60 rounded text-xs text-primary/40 px-2 py-1"
//                             value={value ? "true" : "false"}
//                             onChange={(e) => handleChange(e?.target?.value === "true")}
//                         >
//                             <option value="true">true</option>
//                             <option value="false">false</option>
//                         </select>
//                     ) : (
//                         <pre className="text-primary/80 whitespace-pre-wrap break-words text-xs max-w-full overflow-auto">
//                             <code>{JSON.stringify(value, null, 2)}</code>
//                         </pre>
//                     )}
//                 </div>
//                 {isOptionExpanded && typeof value === "object" && value !== null && !Array.isArray(value) && (
//                     <div className="pl-4">
//                         {renderAttributes(value, true, (childUpdated) => {
//                             const updated = { ...attributes, [key]: childUpdated };
//                             onChange?.(updated);
//                         })}
//                     </div>
//                 )}
//             </div>
//         );
//     });

// }



// const toggleDropdown = () => {
//     setIsDropdownOpen(!isDropdownOpen);
// };


// return (
//     <div className="mb-2 bg-white flex flex-col gap-2">
//         <button
//             onClick={toggleDropdown}
//             className="border-l-4 shadow-md border-primary flex w-full items-center p-2 text-primary justify-between font-semibold rounded-md gap-2 "
//         >
//             <span>Show details</span>
//             {isDropdownOpen ? (
//                 <FaChevronUp className="text-white" />
//             ) : (
//                 <FaChevronDown className="text-white" />
//             )}
//         </button>

//         {isDropdownOpen && (
//             <>
//                 {selectors && selectors.length > 0 && (
//                     <>
//                         <div
//                             onClick={toggleSelectorsExpand}
//                             className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isSelectorsExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"}`}
//                         >
//                             <span className="font-medium">Selectors</span>
//                             <span>{isSelectorsExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                         </div>
//                         {isSelectorsExpanded && (
//                             <div className="pt-4">
//                                 {renderSelectors(selectors, (updated) => {
//                                     setSelectors(updated);
//                                     const updatedValue = {
//                                         ...value,
//                                         data: {
//                                             ...(value.data || {}),
//                                             selectors: updated,
//                                         },
//                                     };
//                                     onChange?.(updatedValue);
//                                 })}
//                             </div>
//                         )}
//                     </>
//                 )}

//                 {attributes && Object.keys(attributes)?.length > 0 && (
//                     <>
//                         <div
//                             onClick={toggleAttributesExpand}
//                             className={`py-2 px-4 flex justify-between items-center shadow-md text-primary cursor-pointer rounded-md transition-all duration-300 ${isAttributesExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"}`}
//                         >
//                             <span className="font-medium">Attributes</span>
//                             <span>{isAttributesExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                         </div>
//                         {isAttributesExpanded && (
//                             <div className="pt-4">
//                                 {renderAttributes(attributes, isAttributesExpanded, (updated) => {
//                                     setAttributes(updated);
//                                     onChange?.({
//                                         ...value,
//                                         data: {
//                                             ...(value?.data || {}),
//                                             attributes: updated,
//                                         },
//                                     });
//                                 })}
//                             </div>
//                         )}
//                     </>
//                 )}

//                 {context && Object.keys(context).length > 0 && (
//                     <>
//                         <div
//                             onClick={toggleContextExpand}
//                             className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isContextExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
//                                 }`}
//                         >
//                             <span className="font-medium">Context</span>
//                             <span>{isContextExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                         </div>

//                         {isContextExpanded && (
//                             <div className="pt-4">
//                                 {renderAttributes(context, true, (updated) => {
//                                     setContext(updated);
//                                     onChange?.({ ...value, context: updated });
//                                 })}
//                             </div>
//                         )}
//                     </>
//                 )}

//                 {contextGeneral && Object.keys(contextGeneral).length > 0 && (
//                     <>
//                         <div
//                             onClick={toggleContextGeneralExpand}
//                             className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isContextGeneralExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
//                                 }`}
//                         >
//                             <span className="font-medium">Context General</span>
//                             <span>{isContextGeneralExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                         </div>

//                         {isContextGeneralExpanded && (
//                             <div className="pt-4">
//                                 {renderAttributes(contextGeneral, true, (updated) => {
//                                     setContextGeneral(updated);
//                                     onChange?.({ ...value, data: updated });
//                                 })}
//                             </div>
//                         )}
//                     </>
//                 )}

//                 {coordinates && Object.keys(coordinates)?.length > 0 && (
//                     <>
//                         <div
//                             onClick={toggleCoordinatesExpand}
//                             className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isCoordinatesExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
//                                 }`}
//                         >
//                             <span className="font-medium">Coordinates</span>
//                             <span>{isCoordinatesExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                         </div>

//                         {isCoordinatesExpanded && (
//                             <div className="pt-4">
//                                 {renderAttributes(coordinates, true, (updated) => {
//                                     setCoordinates(updated);
//                                     onChange?.({
//                                         ...value,
//                                         data: {
//                                             ...(value.data || {}),
//                                             coordinates: updated
//                                         }
//                                     });

//                                 })}
//                             </div>
//                         )}
//                     </>
//                 )}

//                 {conditionalAssert ? (() => {
//                     return (
//                         <>
//                             <div
//                                 onClick={toggleConditionalAssertExpand}
//                                 className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isConditionalAssertExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
//                                     }`}
//                             >
//                                 <span className="font-medium">Conditional Assert</span>
//                                 <span>{isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
//                             </div>

//                             {isConditionalAssertExpanded && (
//                                 <div className="pt-2">
//                                     {conditionalAssert.operationsPlan && conditionalAssert.operationsPlan.length > 0 && (
//                                         <div className="pt-2">
//                                             {conditionalAssert.operationsPlan.map((op: any, idx: number) => (
//                                                 <div key={idx} className="flex flex-col gap-4 p-2 shadow-md">
//                                                     <div
//                                                         onClick={() => toggleOperationExpand(idx)}
//                                                         className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${expandedOperations[idx] ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
//                                                             }`}
//                                                     >
//                                                         <span className="font-medium">{op.operationType}</span>
//                                                         <span>{expandedOperations[idx] ? <FaChevronUp /> : <FaChevronDown />}</span>
//                                                     </div>

//                                                     {expandedOperations[idx] && (
//                                                         <div className="pt-4">

//                                                             <div className="flex flex-col gap-2">
//                                                                 {op?.id && (<span className="text-primary/80">id: {op?.id}</span>)}
//                                                                 <span className="text-primary/70">Operation Type: {op.operationType}</span>
//                                                             </div>

//                                                             {op?.element?.selectors && op?.element?.selectors?.length > 0 && (
//                                                                 <>
//                                                                     <div
//                                                                         onClick={toggleSelectorsConditionalAssertExpand}
//                                                                         className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isSelectorConditionalAssertExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"}`}
//                                                                     >
//                                                                         <span className="font-medium">Selectors</span>
//                                                                         <span>{isSelectorConditionalAssertExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                                                                     </div>
//                                                                     {isSelectorConditionalAssertExpanded && (
//                                                                         <>
//                                                                             {renderSelectors(op?.element?.selectors, (updated) => {
//                                                                                 const updatedConditionalAssert = {
//                                                                                     ...conditionalAssert,
//                                                                                     operationsPlan: conditionalAssert.operationsPlan.map((item: any, index: number) =>
//                                                                                         index === idx ? { ...item, element: { ...item.element, selectors: updated } } : item
//                                                                                     ),
//                                                                                 };
//                                                                                 setConditionalAssert(updatedConditionalAssert);
//                                                                                 onChange?.({ ...value, conditionalElement: updatedConditionalAssert });
//                                                                             }
//                                                                             )}

//                                                                         </>
//                                                                     )}

//                                                                 </>

//                                                             )}

//                                                             {op?.element?.attributes && Object.keys(op?.element?.attributes)?.length > 0 && (
//                                                                 <>
//                                                                     <div
//                                                                         onClick={toggleAttributesConditionalAssertExpand}
//                                                                         className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isAttributesConditionalAssertExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"}`}
//                                                                     >
//                                                                         <span className="font-medium">Attributes</span>
//                                                                         <span>{isAttributesConditionalAssertExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
//                                                                     </div>
//                                                                     {isAttributesConditionalAssertExpanded && (
//                                                                         <div className="pt-4">
//                                                                             {renderAttributes(op?.element?.attributes, true, (updated) => {
//                                                                                 const updatedConditionalAssert = {
//                                                                                     ...conditionalAssert,
//                                                                                     operationsPlan: conditionalAssert.operationsPlan.map((item: any, index: number) =>
//                                                                                         index === idx ? { ...item, element: { ...item.element, attributes: updated } } : item
//                                                                                     ),
//                                                                                 };
//                                                                                 setConditionalAssert(updatedConditionalAssert);
//                                                                                 onChange?.({ ...value, conditionalElement: updatedConditionalAssert });
//                                                                             }
//                                                                             )}

//                                                                         </div>
//                                                                     )}
//                                                                 </>
//                                                             )}

//                                                             {op?.element?.coordinates && Object.keys(op?.element?.coordinates)?.length > 0 && (
//                                                                 <div className="pt-4">
//                                                                     {renderAttributes(op?.element?.coordinates, true, (updated) => {
//                                                                         const updatedConditionalAssert = {
//                                                                             ...conditionalAssert,
//                                                                             operationsPlan: conditionalAssert.operationsPlan.map((item: any, index: number) =>
//                                                                                 index === idx ? { ...item, element: { ...item.element, coordinates: updated } } : item
//                                                                             ),
//                                                                         };
//                                                                         setConditionalAssert(updatedConditionalAssert);
//                                                                         onChange?.({ ...value, conditionalElement: updatedConditionalAssert });
//                                                                     })}
//                                                                 </div>
//                                                             )}
//                                                             {op.regex != "" && (
//                                                                 <div className="pt-4">
//                                                                     <TextInputWithClearButton
//                                                                         id={op?.regex}
//                                                                         label="Regex"
//                                                                         value={op?.regex}
//                                                                         onChangeHandler={(e) => {
//                                                                             const updatedConditionalAssert = {
//                                                                                 ...conditionalAssert,
//                                                                                 operationsPlan: conditionalAssert.operationsPlan.map((item: any, index: number) =>
//                                                                                     index === idx ? { ...item, regex: e.target.value } : item
//                                                                                 ),
//                                                                             };
//                                                                             setConditionalAssert(updatedConditionalAssert);
//                                                                             onChange?.({ ...value, conditionalElement: updatedConditionalAssert });
//                                                                         }}
//                                                                         placeholder="regex"
//                                                                     />
//                                                                 </div>
//                                                             )}
//                                                             {op?.element?.image && (
//                                                                 <div className="pt-4 flex flex-col gap-2">
//                                                                     <span className="text-primary/70">Image</span>
//                                                                     <Image
//                                                                         src={op.element.image}
//                                                                         alt={`image ${op.id}`}
//                                                                         height={40}
//                                                                         width={100}
//                                                                         className="object-contain w-auto h-[100px]"
//                                                                     />
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     )}

//                                                 </div>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>
//                             )}
//                         </>
//                     );
//                 })() : null}


//                 {Object.keys(remainingFields).length > 0 && (
//                     <div className="pt-4">
//                         {renderAttributes(remainingFields, true, (updated) => {
//                             const cleanedData = { ...(value.data || {}) };

//                             for (const key of Object.keys(updated)) {
//                                 if (key in cleanedData) {
//                                     delete cleanedData[key];
//                                 }
//                             }

//                             const updatedValue = {
//                                 ...value,
//                                 ...updated,
//                                 data: cleanedData,
//                             };

//                             onChange?.(updatedValue);
//                         })}

//                     </div>
//                 )}
//             </>
//         )
//         }
//     </div>
// );


