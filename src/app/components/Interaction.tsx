import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import ClipboardComponent from "./Clipboard";
import { FaIntercom } from "react-icons/fa6";
import TextInputWithClearButton from "./InputClear";

interface InteractionItemData {
    id?: string;
    action?: string;
    [key: string]: any;
}

interface InteractionItemProps {
    data?: InteractionItemData;
    index?: number;
    isContext?: boolean;
    onStepUpdate?: (updatedData: InteractionItemData) => void;
}

const JSONBox = ({ value, onUpdate }: { label: string; value: any; onUpdate?: (updated: any) => void }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [editableData, setEditableData] = useState<any>({});
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState<string>("");

    useEffect(() => {
        setEditableData(structuredClone(value));
    }, [value]);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    const handleInputChange = (path: string[], newValue: string) => {
        setTempValue(newValue);
    };

    const handleConfirmEdit = (path: string[]) => {
        const updated = { ...editableData };
        let current = updated;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = tempValue;
        setEditableData(updated);
        setEditingField(null);
        onUpdate?.(updated);
    };

    const handleCancelEdit = () => {
        setTempValue("");
        setEditingField(null);
    };

    const renderEditableAttributes = (obj: any, path: string[] = []) => {
        return Object.entries(obj).map(([key, val], idx) => {
            const currentPath = [...path, key];
            const pathString = currentPath.join(".");
            const toggle = () => toggleSection(pathString);

            return (
                <div key={idx} className="mb-2 border-b pb-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-[#223242]">{key}</span>
                        <div className="flex gap-2 items-center">
                            <ClipboardComponent
                                text={JSON.stringify(val)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                            />
                            {editingField !== pathString && (
                                <button
                                    onClick={() => {
                                        setEditingField(pathString);
                                        setTempValue(String(val));
                                    }}
                                    className="p-1 focus:outline-none focus:ring-1 text-xs text-gray-400 hover:text-gray-600"
                                    title="Edit"
                                >
                                    <FaEdit size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {typeof val === "object" && val !== null ? (
                        <>
                            <div
                                onClick={toggle}
                                className="flex items-center gap-1 text-sm cursor-pointer text-[#051d3d] mt-1 font-medium hover:underline"
                            >
                                {expandedSections[pathString] ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </div>
                            {expandedSections[pathString] && (
                                <div className="ml-4 mt-2 border-l pl-3">
                                    {renderEditableAttributes(val, currentPath)}
                                </div>
                            )}
                        </>
                    ) : editingField === pathString ? (
                        <div className="flex items-center gap-2 mt-1">
                            <TextInputWithClearButton
                                id={tempValue}
                                value={tempValue}
                                onChangeHandler={(e) => handleInputChange(currentPath, e.target.value)}
                            />
                            <button
                                onClick={() => handleConfirmEdit(currentPath)}
                                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                                title="Confirm"
                            >
                                <FaCheck size={14}/>
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="text-xs text-gray-400 hover:text-gray-600 p-1"
                                title="Cancel"
                            >
                                <FaTimes size={14}/>
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-700">{String(val)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="mb-2">
            <button
                onClick={toggleDropdown}
                className="border-l-4 border-[#051d3d]/70 flex w-full items-center p-2 text-[#051d3d]/80 justify-between font-semibold rounded-md gap-2"
            >
                <span className="text-[#051d3d]/80">Show details</span>
                {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {isDropdownOpen && (
                <div className="pt-4">
                    {renderEditableAttributes(editableData)}
                </div>
            )}
        </div>
    );
};

const InteractionItem = ({ data, index, isContext, onStepUpdate }: InteractionItemProps) => {
    return (
        <div key={data?.id} data-index={index} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 py-2 px-2 text-[#051d3d]/80 rounded-md border-l-4 border-[#051d3d]/70 shadow-lg transition-all duration-300">
                <div className="flex justify-between items-center">
                    <p className="font-semibold">{data?.action}</p>
                    {data?.action === "change"?(
                        <>
                            <span>{data.data.attributes["name"] || data.data.attributes["placeholder"]  }</span>
                        </>
                    ):(<>
                    </>)}
                    {data?.action === "click"?(
                        <>
                            <span>{data.data.text}</span>
                        </>
                    ):(<>
                    </>)}
                    <span className="bg-[#051d3d]/70 text-white/80 tracking-wide font-semibold rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm">
                        {data?.indexStep ?? <FaIntercom />}
                    </span>
                   
                </div>
                <JSONBox label="Details" value={data} onUpdate={(updated) => onStepUpdate?.(updated)} />
            </div>
        </div>
    );
};

export default InteractionItem;
