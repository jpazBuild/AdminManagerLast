import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaTrash } from "react-icons/fa";
import ClipboardComponent from "./Clipboard";
import { FaTrashCan, FaXmark } from "react-icons/fa6";
import TextInputWithClearButton from "./InputClear";
import Image from "next/image";
import CopyToClipboard from "./CopyToClipboard";
import DeleteButton from "./DeleteButton";

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

const JSONBox = ({
    value,
    onChange,
}: {
    label: string;
    value: any;
    onChange?: (newValue: any) => void;
}) => {
    const [isSelectorsExpanded, setIsSelectorsExpanded] = useState(false);
    const [isAttributesExpanded, setIsAttributesExpanded] = useState(false);
    const [isContextExpanded, setIsContextExpanded] = useState(false);
    const [isContextGeneralExpanded, setIsContextGeneralExpanded] = useState(false);
    const [isCoordinatesExpanded, setIsCoordinatesExpanded] = useState(false);
    const [selectors, setSelectors] = useState<any>();
    const [attributes, setAttributes] = useState<any>();
    const [context, setContext] = useState<any>();
    const [contextGeneral, setContextGeneral] = useState<any>();
    const [updatedData, setUpdatedData] = useState<any>();
    const [coordinates, setCoordinates] = useState<any>();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {

        if (Object?.keys(value?.data).includes("selectors")) {
            setSelectors(value?.data?.selectors);
        }
        if (Object?.keys(value?.data).includes("attributes")) {
            setAttributes(value?.data?.attributes);
        }
        if (Object?.keys(value).includes("context")) {
            setContext(value?.context);
        }
        if (value?.action === "navigate") {
            setContextGeneral(value.data);
        }

        const updatedData = {
            ...value,
            context: undefined,
            action: undefined,
            data: {
                ...value?.data,
                selectors: undefined,
                attributes: undefined
            }
        };

        const flattenedData = {
            ...updatedData,
            ...updatedData?.data,
        };

        delete flattenedData?.data;
        delete flattenedData?.indexStep;
        if (value.action === "navigate") {
            setUpdatedData(undefined)
        } else {
            setUpdatedData(flattenedData)
        }
        if (flattenedData?.coordinates && Object.keys(flattenedData?.coordinates)?.length > 0) {
            setCoordinates(flattenedData?.coordinates);
            delete flattenedData?.coordinates

        }

    }, [value]);

    const toggleSelectorsExpand = () => setIsSelectorsExpanded(!isSelectorsExpanded);
    const toggleAttributesExpand = () => setIsAttributesExpanded(!isAttributesExpanded);
    const toggleContextExpand = () => setIsContextExpanded(!isContextExpanded);
    const toggleContextGeneralExpand = () => setIsContextGeneralExpanded(!isContextGeneralExpanded);
    const toggleCoordinatesExpand = () => setIsCoordinatesExpanded(!isCoordinatesExpanded);

    const renderSelectors = (selectors: any[], onChange?: (updated: any[]) => void) => {


        return selectors?.map((selector, idx) => {
            const handleChange = (newValue: string) => {
                const updated = [...selectors];
                updated[idx] = { ...selector, locator: newValue };
                onChange?.(updated);
            };

            return (
                <div key={idx} className="py-2 px-3 rounded-b-md bg-white">
                    <div className="py-2 px-3  rounded-md flex flex-col w-full items-center gap-2">
                        <div className="w-full flex justify-between">
                            <div className="w-full text-xs text-primary/60">{selector.type}</div>
                            <ClipboardComponent
                                size={14}
                                text={selector?.locator}
                            />
                        </div>
                        <TextInputWithClearButton
                            id={selector?.locator}
                            value={selector?.locator}
                            onChangeHandler={(e) => handleChange(e.target.value)}
                            placeholder="locator"
                        />

                    </div>
                </div>
            );
        });

    };

    const renderAttributes = (attributes: any, isOptionExpanded: boolean,
        onChange?: (updated: any) => void
    ) => {
        if (!attributes || Object.keys(attributes)?.length === 0) {
            return null;
        }

        return Object.entries(attributes).map(([key, value], idx) => {
            if (value === undefined) return null;

            const handleChange = (newValue: any) => {
                const updated = { ...attributes, [key]: newValue };
                onChange?.(updated);
            };

            //if imagen base 64
            if (typeof value === "string" && value.startsWith("data:image")) {
                return (
                    <div key={idx} className="py-2 px-3  rounded-b-md">
                        <div className="w-full py-2 px-3  rounded-md flex flex-col items-center gap-2">
                            <Image src={value} alt={key} width={500} height={500} className="max-h-32 w-auto" />
                        </div>
                    </div>
                );
            }

            return (
                <div key={idx} className="py-2 px-3  rounded-b-md">
                    <div className="w-full py-2 px-3 rounded-md flex flex-col items-center gap-2">
                        <div className="w-full flex justify-between items-center">
                            <div className="w-full text-xs text-primary/60">{key}</div>
                            <ClipboardComponent
                                size={14}
                                text={value}
                            />
                        </div>
                        {typeof value === "string" || typeof value === "number" ? (
                            <TextInputWithClearButton
                                id={String(value)}
                                value={String(value)}
                                onChangeHandler={(e) => handleChange(e?.target?.value)}
                                placeholder={String(value)}
                            />
                        ) : typeof value === "boolean" ? (
                            <select
                                className="bg-transparent border border-primary/60 rounded text-xs text-primary/40 px-2 py-1"
                                value={value ? "true" : "false"}
                                onChange={(e) => handleChange(e?.target?.value === "true")}
                            >
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        ) : (
                            <pre className="text-primary/80 whitespace-pre-wrap break-words text-xs max-w-full overflow-auto">
                                <code>{JSON.stringify(value, null, 2)}</code>
                            </pre>
                        )}
                    </div>
                    {isOptionExpanded && typeof value === "object" && value !== null && !Array.isArray(value) && (
                        <div className="pl-4">
                            {renderAttributes(value, true, (childUpdated) => {
                                const updated = { ...attributes, [key]: childUpdated };
                                onChange?.(updated);
                            })}
                        </div>
                    )}
                </div>
            );
        });

    }



    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    return (
        <div className="mb-2 bg-white flex flex-col gap-2">
            <button
                onClick={toggleDropdown}
                className="border-l-4 shadow-md border-primary flex w-full items-center p-2 text-primary justify-between font-semibold rounded-md gap-2 "
            >
                <span>Show details</span>
                {isDropdownOpen ? (
                    <FaChevronUp className="text-white" />
                ) : (
                    <FaChevronDown className="text-white" />
                )}
            </button>

            {isDropdownOpen && (
                <>
                    {selectors && selectors.length > 0 && (
                        <>
                            <div
                                onClick={toggleSelectorsExpand}
                                className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isSelectorsExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"}`}
                            >
                                <span className="font-medium">Selectors</span>
                                <span>{isSelectorsExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>
                            {isSelectorsExpanded && (
                                <div className="pt-4">
                                    {renderSelectors(selectors, (updated) => {
                                        setSelectors(updated);
                                        const updatedValue = {
                                            ...value,
                                            data: {
                                                ...(value.data || {}),
                                                selectors: updated,
                                            },
                                        };
                                        onChange?.(updatedValue);
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {attributes && Object.keys(attributes)?.length > 0 && (
                        <>
                            <div
                                onClick={toggleAttributesExpand}
                                className={`py-2 px-4 flex justify-between items-center shadow-md text-primary cursor-pointer rounded-md transition-all duration-300 ${isAttributesExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"}`}
                            >
                                <span className="font-medium">Attributes</span>
                                <span>{isAttributesExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>
                            {isAttributesExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(attributes, isAttributesExpanded, (updated) => {
                                        setAttributes(updated);
                                        onChange?.({
                                            ...value,
                                            data: {
                                                ...(value?.data || {}),
                                                attributes: updated,
                                            },
                                        });
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {context && Object.keys(context).length > 0 && (
                        <>
                            <div
                                onClick={toggleContextExpand}
                                className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isContextExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Context</span>
                                <span>{isContextExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isContextExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(context, true, (updated) => {
                                        setContext(updated);
                                        onChange?.({ ...value, context: updated });
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {contextGeneral && Object.keys(contextGeneral).length > 0 && (
                        <>
                            <div
                                onClick={toggleContextGeneralExpand}
                                className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isContextGeneralExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Context General</span>
                                <span>{isContextGeneralExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isContextGeneralExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(contextGeneral, true, (updated) => {
                                        setContextGeneral(updated);
                                        onChange?.({ ...value, data: updated });
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {coordinates && Object.keys(coordinates)?.length > 0 && (
                        <>
                            <div
                                onClick={toggleCoordinatesExpand}
                                className={`py-2 px-4 flex justify-between shadow-md items-center text-primary cursor-pointer rounded-md transition-all duration-300 ${isCoordinatesExpanded ? "rounded-b-none border-l-4 border-primary" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Coordinates</span>
                                <span>{isCoordinatesExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isCoordinatesExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(coordinates, true, (updated) => {
                                        setCoordinates(updated);
                                        onChange?.({ ...value, coordinates: updated });
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {updatedData && (
                        <div className="pt-4">
                            {renderAttributes(updatedData, isContextExpanded)}
                        </div>
                    )

                    }
                </>
            )
            }
        </div>
    );
};

const InteractionItem = ({ data, index, onDelete, onUpdate }: InteractionItemProps) => {
    return (
        <div key={data.id} data-index={index} className="flex flex-col gap-4">
            <div className="relative flex flex-col gap-2 py-2 px-2 text-primary rounded-md border-l-4 border-primary shadow-lg transition-all duration-300">
                <div className="flex justify-center items-center w-full">
                    <div className="flex flex-col">
                    <p className="font-semibold text-center">{data.action}</p>
                    <p className="font-normal text-center">{data?.data?.text || data?.data?.attributes?.name || data?.data?.attributes?.placeholder ||data?.data?.attributes?.["aria-label"] }</p>
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

                <JSONBox label="Details" value={data} onChange={(newData) => {
                    onUpdate?.(index, newData);
                }} />
            </div>
        </div>
    );
};


export default InteractionItem;