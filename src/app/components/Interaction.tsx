import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ClipboardComponent from "./Clipboard";

interface InteractionItemData {
    id: string;
    action: string;
    [key: string]: any;
}

interface InteractionItemProps {
    data: InteractionItemData;
    index: number;
    isContext?: boolean;
}

const JSONBox = ({ value }: { label: string; value: any }) => {
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

        if (Object.keys(value.data).includes("selectors")) {
            setSelectors(value.data.selectors);
        }
        if (Object.keys(value.data).includes("attributes")) {
            setAttributes(value.data.attributes);
        }
        if (Object.keys(value).includes("context")) {
            setContext(value.context);
        }
        if (value.action === "navigate") {
            setContextGeneral(value.data);
        }

        const updatedData = {
            ...value,
            context: undefined,
            action: undefined,
            data: {
                ...value.data,
                selectors: undefined,
                attributes: undefined
            }
        };

        const flattenedData = {
            ...updatedData,
            ...updatedData.data,
        };

        delete flattenedData.data;
        delete flattenedData.indexStep;
        if (value.action === "navigate") {
            setUpdatedData(undefined)
        } else {
            setUpdatedData(flattenedData)
        }
        if (flattenedData.coordinates && Object.keys(flattenedData.coordinates).length > 0) {
            setCoordinates(flattenedData.coordinates);
            delete flattenedData.coordinates

        }

    }, [value]);

    const toggleSelectorsExpand = () => setIsSelectorsExpanded(!isSelectorsExpanded);
    const toggleAttributesExpand = () => setIsAttributesExpanded(!isAttributesExpanded);
    const toggleContextExpand = () => setIsContextExpanded(!isContextExpanded);
    const toggleContextGeneralExpand = () => setIsContextGeneralExpanded(!isContextGeneralExpanded);
    const toggleCoordinatesExpand = () => setIsCoordinatesExpanded(!isCoordinatesExpanded);

    const renderSelectors = (selectors: any[]) => {
        return selectors.map((selector, idx) => (
            <div key={idx} className="py-2 px-3  rounded-b-md">
                <div className="py-2 px-3  rounded-md flex justify-between items-center shadow-md font-semibold">
                    <div className="text-xs ">{selector.type}</div> <ClipboardComponent size={14} text={selector.locator} className={"rounded-md text-gray-400 hover:text-gray-300 focus:text-green-500 text-xs"} />
                </div>
                {isSelectorsExpanded && (
                    <pre className="p-2  rounded-md text-wrap text-start font-normal gap-2 text-xs overflow-auto max-w-full">
                        <code className=" break-words">{selector.locator}</code>
                    </pre>
                )}
            </div>
        ));
    };

    const renderAttributes = (attributes: any, isOptionExpanded: boolean) => {
        if (!attributes || Object.keys(attributes).length === 0) {
            return null;
        }

        return Object.entries(attributes).map(([key, value], idx) => {
            if (value === undefined) {
                return null;
            }

            return (
                <div key={idx} className="py-2 px-3  rounded-b-md">
                    <div className="py-2 px-3  rounded-md flex justify-between items-center shadow-md">
                        <div className="text-xs ">{key}</div>
                        <ClipboardComponent
                            size={14}
                            text={String(value)}
                            className={"rounded-md text-xs"}
                        />
                    </div>
                    {isOptionExpanded ? (
                        Array.isArray(value) ? (
                            <div className="p-2 rounded-md">
                                <pre className="text-wrap text-start font-normal gap-2 text-xs overflow-auto max-w-full">
                                    <code className="break-words">{JSON.stringify(value, null, 2)}</code>
                                </pre>
                            </div>
                        ) : typeof value === "object" && value !== null ? (
                            <div className="p-2  rounded-md">
                                <pre className="text-wrap text-start font-normal gap-2 text-xs overflow-auto max-w-full">
                                    {renderAttributes(value, true)}
                                </pre>
                            </div>
                        ) : value === "" ? (
                            <div className="p-2 rounded-md italic">No data available</div>
                        ) : (
                            <pre className="p-2 rounded-md text-wrap text-start font-normal gap-2 text-xs overflow-auto max-w-full">
                                <code className=" break-words">{String(value)}</code>
                            </pre>
                        )
                    ) : value === "" ? (
                        <div className="p-2 rounded-md italic">No data available</div>
                    ) : (
                        <div className="p-2 rounded-md ">{String(value)}</div>
                    )}

                </div>
            );
        });
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    return (
        <div className="mb-2">
            <button
                onClick={toggleDropdown}
                className="border-l-4 border-blue-500 flex w-full items-center p-2   justify-between font-semibold rounded-md gap-2"
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
                                className={`shadow-md py-2 px-4 flex justify-between items-center cursor-pointer rounded-md transition-all duration-300 ${isSelectorsExpanded ? "rounded-b-none border-l-4 border-blue-500" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Selectors</span>
                                <span>{isSelectorsExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isSelectorsExpanded && (
                                <div className="pt-4">
                                    {renderSelectors(selectors)}
                                </div>
                            )}
                        </>
                    )}
                    {attributes && Object.keys(attributes).length > 0 && (
                        <>
                            <div
                                onClick={toggleAttributesExpand}
                                className={`shadow-md py-2 px-4 flex justify-between items-center cursor-pointer rounded-md transition-all duration-300 ${isAttributesExpanded ? "rounded-b-none border-l-4 border-blue-500" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Attributes</span>
                                <span>{isAttributesExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isAttributesExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(attributes, isAttributesExpanded)}
                                </div>
                            )}
                        </>
                    )}

                    {context && Object.keys(context).length > 0 && (
                        <>
                            <div
                                onClick={toggleContextExpand}
                                className={`shadow-md py-2 px-4 flex justify-between items-center cursor-pointer rounded-md transition-all duration-300 ${isAttributesExpanded ? "rounded-b-none border-l-4 border-blue-500" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Context</span>
                                <span>{isContextExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isContextExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(context, isContextExpanded)}
                                </div>
                            )}
                        </>
                    )}
                    {contextGeneral && Object.keys(contextGeneral).length > 0 && (
                        <>
                            <div
                                onClick={toggleContextGeneralExpand}
                                className={`shadow-md py-2 px-4 flex justify-between items-center cursor-pointer rounded-md transition-all duration-300 ${isAttributesExpanded ? "rounded-b-none border-l-4 border-blue-500" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Context General</span>
                                <span>{isContextGeneralExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isContextGeneralExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(contextGeneral, isContextGeneralExpanded)}
                                </div>
                            )}
                        </>
                    )}
                    {coordinates && Object.keys(coordinates).length > 0 && (
                        <>
                            <div
                                onClick={toggleCoordinatesExpand}
                                className={`shadow-md py-2 px-4 flex justify-between items-center  cursor-pointer rounded-md transition-all duration-300 ${isAttributesExpanded ? "rounded-b-none border-l-4 border-blue-500" : "rounded-md"
                                    }`}
                            >
                                <span className="font-medium">Coordinates</span>
                                <span>{isCoordinatesExpanded ? <FaChevronUp /> : <FaChevronDown />}</span>
                            </div>

                            {isCoordinatesExpanded && (
                                <div className="pt-4">
                                    {renderAttributes(coordinates, isCoordinatesExpanded)}
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

const InteractionItem = ({ data, index }: InteractionItemProps) => {
    return (
        <div key={data.id} data-index={index} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 py-2 px-2  rounded-md border-l-4 border-blue-500 shadow-lg transition-all duration-300">
                {data.action === "navigate" ? (
                    <p className="font-semibold">{data.action} </p>
                ) : (
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">{data.action}</p>
                        {/* <span className="bg-blue-600  rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm">
                            {data.indexStep}
                        </span> */}
                    </div>

                )}

                <JSONBox label="Details" value={data} />
            </div>
        </div>
    );
};

export default InteractionItem;
