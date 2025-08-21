"use client";
import React from 'react';
import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import { Copy, Save, Trash2 } from "lucide-react";
import { FaXmark } from "react-icons/fa6";
import { useCallback, useMemo } from 'react';
import CopyToClipboard from "./CopyToClipboard";
import TextInputWithClearButton from './InputClear';

interface InteractionItemData {
    id: string;
    action?: string;
    name?: string;
    description?: string;
    type?: string;
    stepsData?: any[];
    stepData?: any;
    [key: string]: any;
}

interface InteractionItemProps {
    data: InteractionItemData;
    index: number;
    isContext?: boolean;
    onDelete?: (index: number) => void;
    onUpdate?: (index: number, updatedData: InteractionItemData) => void;
    isDarkMode?: boolean;
    test?: any;
    steps?: any[];
    setTestCasesData?: React.Dispatch<React.SetStateAction<any[]>>;
    setResponseTest?: React.Dispatch<React.SetStateAction<any>>;
    showDelete?: boolean;
}

interface JSONBoxProps {
    value: any;
    onChange?: (value: any) => void;
    isDarkMode?: boolean;
}

interface PanelState {
    [key: string]: boolean;
}

const DeleteButton = ({ onClick,isDarkMode=false }: { onClick: () => void,isDarkMode:boolean }) => (
    <button
        onClick={onClick}
        className={`p-1 rounded ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
    >
        <Trash2 className="w-4 h-4" />
    </button>
);

function DisplayImageWithFetch({
    src,
    alt,
    isDarkMode = false,
    ...props
}: {
    src: string;
    alt?: string;
    isDarkMode?: boolean;
    [key: string]: any;
}) {
    const [isError, setIsError] = React.useState(false);

    React.useEffect(() => {
        setIsError(false);
    }, [src]);

    if (!src || isError) {
        const containerClasses = isDarkMode 
            ? "flex flex-col items-center justify-center bg-slate-700/50 border border-slate-600 px-3 py-4 rounded-md max-h-32 min-h-[6rem] min-w-[8rem]"
            : "flex flex-col items-center justify-center bg-gray-100 px-3 py-4 rounded-md max-h-32 min-h-[6rem] min-w-[8rem]";
        
        const iconColor = isDarkMode ? "text-slate-400" : "text-gray-400";
        const textColor = isDarkMode ? "text-slate-300" : "text-gray-400";
        
        return (
            <div className={containerClasses}>
                <svg
                    className={`w-10 h-10 ${iconColor} mb-2`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" fill={isDarkMode ? "#475569" : "#e5e7eb"}/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill={isDarkMode ? "#64748b" : "#cbd5e1"} />
                    <path d="M21 17l-5-5-7 7" stroke={isDarkMode ? "#94a3b8" : "#94a3b8"} strokeWidth={2} />
                </svg>
                <span className={`text-xs ${textColor} break-all`}>
                    Image not available
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

const JSONBox: React.FC<JSONBoxProps> = ({ value, onChange, isDarkMode = false }) => {
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
            onChange?.(parsed);
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

    const getDropdownHeaderClasses = () => {
        if (isDarkMode) {
            return "flex justify-between items-center bg-slate-800/90 cursor-pointer rounded-md border-l-4 border-slate-500 p-2 hover:bg-slate-700/90 transition-colors duration-200";
        }
        return "flex justify-between items-center bg-white cursor-pointer rounded-md border-l-6 border-1 border-primary p-2 hover:bg-primary/10 transition-colors";
    };

    const getDropdownHeaderTextClasses = () => {
        return isDarkMode ? "text-white/90 font-semibold" : "text-primary/80 font-semibold";
    };

    const getDropdownHeaderIconClasses = () => {
        return isDarkMode ? "text-white/90" : "text-primary";
    };

    const getPanelContainerClasses = () => {
        return isDarkMode 
            ? "bg-slate-800/50 border border-slate-600 rounded-lg overflow-hidden" 
            : "border border-gray-200 rounded-lg overflow-hidden";
    };

    const getFieldEditorContainerClasses = () => {
        return isDarkMode 
            ? "flex flex-col gap-2 mb-3 p-2 bg-slate-700/50 text-white/90 rounded-md border border-slate-600/50" 
            : "flex flex-col gap-2 mb-3 p-2 bg-gray-50 rounded-md";
    };

    const getFieldEditorLabelClasses = () => {
        return isDarkMode ? "text-xs text-slate-300 font-medium" : "text-xs text-gray-600 font-medium";
    };

    const getFieldEditorButtonClasses = () => {
        return isDarkMode 
            ? "text-xs cursor-pointer text-slate-400 px-2 py-1 rounded bg-slate-600/50 hover:bg-slate-500/50 hover:text-slate-200 transition-colors duration-200" 
            : "text-xs cursor-pointer text-primary/70 px-2 py-1 rounded transition-colors";
    };

    const getTextInputClasses = () => {
        if (isDarkMode) {
            return "w-full px-3 py-2 bg-slate-700 border border-white/60 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-white/50 transition-colors";
        }
        return "w-full px-3 py-2 border border-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-primary/20 text-primary placeholder-primary/50 transition-colors";
    };

    const getJSONPreviewClasses = () => {
        if (isDarkMode) {
            return "bg-slate-800 border border-white/60 text-white/80 p-2 rounded-md overflow-auto text-xs font-mono max-h-64";
        }
        return "bg-primary/20 text-primary p-2 rounded-md overflow-auto text-xs font-mono max-h-64";
    };

    const getEditButtonClasses = () => {
        if (isDarkMode) {
            return "flex items-center gap-1 mt-2 px-3 py-1 rounded bg-white/60 text-white text-md hover:bg-white/70 transition-colors duration-200";
        }
        return "flex items-center gap-1 mt-2 px-3 py-1 rounded bg-primary/10 text-primary text-md hover:bg-primary/20";
    };

    const getTextareaClasses = () => {
        if (isDarkMode) {
            return "focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-primary/50 w-full p-3 rounded-md bg-white/80 border border-slate-600 font-mono text-xs text-slate-200 placeholder-slate-400 min-h-[180px] max-h-64 transition-colors";
        }
        return "focus:outline-none focus:ring-0 focus:border-primary w-full p-3 rounded-md bg-primary/20 border border-primary/20 font-mono text-xs text-primary min-h-[180px] max-h-64";
    };

    const getSaveButtonClasses = () => {
        if (isDarkMode) {
            return "flex items-center gap-1 px-3 py-1 text-md rounded bg-green-600 text-white hover:bg-green-700 transition-colors duration-200";
        }
        return "flex items-center gap-1 px-3 py-1 text-md rounded bg-primary text-white hover:bg-primary/90";
    };

    const getCancelButtonClasses = () => {
        if (isDarkMode) {
            return "flex items-center gap-1 px-3 py-1 text-md rounded bg-slate-600 text-white hover:bg-slate-700 transition-colors duration-200";
        }
        return "flex items-center gap-1 px-3 py-1 text-md rounded bg-gray-200 text-primary hover:bg-gray-300";
    };

    const getErrorTextClasses = () => {
        return isDarkMode ? "text-red-400 text-md mt-1" : "text-red-600 text-md mt-1";
    };

    const DropdownHeader = useCallback(({ label, panelKey }: { label: string; panelKey: string }) => (
        <div
            className={getDropdownHeaderClasses() + `${isDarkMode ? " !text-slate-500" : " text-primary/70"}`}
            onClick={() => togglePanel(panelKey)}
        >
            <span className={getDropdownHeaderTextClasses()}>{label}</span>
            {openPanels[panelKey] ?
                <FaChevronUp className={getDropdownHeaderIconClasses()} /> :
                <FaChevronDown className={getDropdownHeaderIconClasses()} />
            }
        </div>
    ), [openPanels, togglePanel, isDarkMode]);

    const updateNestedData = useCallback((path: string[], newValue: any) => {
        if (!onChange) return;

        const updatedValue = JSON.parse(JSON.stringify(value));
        let current = updatedValue;

        for (let i = 0; i < path.length - 1; i++) {
            if (current[path[i]] === undefined) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }

        current[path[path.length - 1]] = newValue;
        onChange(updatedValue);
    }, [value, onChange]);

    const deleteNestedProperty = useCallback((path: string[]) => {
        if (!onChange) return;

        const updatedValue = JSON.parse(JSON.stringify(value));
        let current = updatedValue;

        for (let i = 0; i < path.length - 1; i++) {
            if (current[path[i]] === undefined) return;
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
        <div className={getFieldEditorContainerClasses()}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <CopyToClipboard
                        text={String(fieldValue)}
                        isDarkMode={isDarkMode}
                    />
                    <button
                        onClick={onDelete}
                        className={getFieldEditorButtonClasses()}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <TextInputWithClearButton
                id={label}
                value={String(fieldValue)}
                onChangeHandler={(e: any) => onUpdate(e.target.value)}
                placeholder={label}
                label={`${label}`}
            />
        </div>
    ), [isDarkMode]);

    const processedData = useMemo(() => {
        if (!value) return null;        
        return {
            hasNavigation: value.action === "navigate" || value.stepData?.action === "navigate",
            hasContext: value.context || value.stepData?.context,
            hasSelectors: value?.data?.selectors?.length > 0 || value?.stepData?.data?.selectors?.length > 0,
            hasAttributes: Object.keys(value?.data?.attributes || value?.stepData?.data?.attributes || {}).length > 0,
            hasCoordinates: (value?.data?.coordinates && Object.keys(value.data.coordinates).length > 0) || 
                          (value?.stepData?.data?.coordinates && Object.keys(value.stepData.data.coordinates).length > 0),
            hasImage: value?.data?.image || value?.stepData?.data?.image,
            hasText: value?.data?.text || value?.text || value?.stepData?.data?.text || value?.stepData?.text,
            hasTimeStamp: value?.data?.timeStamp || value?.stepData?.data?.timeStamp,
            hasPageIndex: value?.pageIndex !== undefined || value?.stepData?.pageIndex !== undefined,
            hasIndexStep: value?.indexStep !== undefined || value?.stepData?.indexStep !== undefined,
            hasTypeToAssert: value?.typeAssert !== undefined || value?.stepData?.typeAssert !== undefined,
            hasValueToAssert: value?.valueToAssert !== undefined || value?.stepData?.valueToAssert !== undefined,
        };
    }, [value]);

    if (!value || !processedData) {
        const noDataClasses = isDarkMode 
            ? "text-slate-300 text-center p-4 bg-slate-800/50 border border-slate-600 rounded-lg" 
            : "text-gray-500 text-center p-4";
        return <div className={noDataClasses}>No data available</div>;
    };

    const containerClasses = isDarkMode 
        ? "rounded-lg shadow-lg bg-slate-800/90 border border-slate-600 overflow-hidden px-2" 
        : "rounded-lg shadow-lg bg-white overflow-hidden px-2";

    const actualData = value.stepData || value;

    return (
        <div className={containerClasses}>
            <DropdownHeader label="Show Options" panelKey="showOptions" />

            {openPanels.showOptions && (
                <div className="p-1 flex flex-col gap-2 mt-2">
                    {processedData.hasNavigation && (
                        <div className={getPanelContainerClasses()}>
                            <DropdownHeader label="Navigate Data" panelKey="navigateData" />
                            {openPanels.navigateData && (
                                <div className={`p-4 ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
                                    {Object.entries(actualData.data)
                                        .filter(([key]) => key !== "pageSize")
                                        .map(([key, val]) => (
                                            <FieldEditor
                                                key={key}
                                                label={key}
                                                fieldValue={val}
                                                onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'data', key] : ['data', key], newValue)}
                                                onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'data', key] : ['data', key])}
                                            />
                                        ))}

                                    {actualData.data.pageSize && Object.entries(actualData.data.pageSize).map(([key, val]) => (
                                        <FieldEditor
                                            key={`pageSize-${key}`}
                                            label={`Page Size - ${key}`}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'data', 'pageSize', key] : ['data', 'pageSize', key], newValue)}
                                            onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'data', 'pageSize', key] : ['data', 'pageSize', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasContext && (
                        <div className={getPanelContainerClasses()}>
                            <DropdownHeader label="Context" panelKey="context" />
                            {openPanels.context && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(actualData.context.data)
                                        .filter(([key]) => key !== "window")
                                        .map(([key, val]) => (
                                            <FieldEditor
                                                key={key}
                                                label={key}
                                                fieldValue={val}
                                                onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'context', 'data', key] : ['context', 'data', key], newValue)}
                                                onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'context', 'data', key] : ['context', 'data', key])}
                                            />
                                        ))}

                                    {actualData.context.data.window && Object.entries(actualData.context.data.window).map(([key, val]) => (
                                        <FieldEditor
                                            key={`window-${key}`}
                                            label={`Window - ${key}`}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'context', 'data', 'window', key] : ['context', 'data', 'window', key], newValue)}
                                            onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'context', 'data', 'window', key] : ['context', 'data', 'window', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasSelectors && (
                        <div className={getPanelContainerClasses()}>
                            <DropdownHeader label="Selectors" panelKey="selectors" />
                            {openPanels.selectors && (
                                <div className="p-4 space-y-3">
                                    {actualData.data.selectors.map((selector: any, idx: number) => (
                                        <FieldEditor
                                            key={idx}
                                            label={selector.type}
                                            fieldValue={selector.locator}
                                            onUpdate={(newValue) => {
                                                const path = value.stepData ? ['stepData', 'data', 'selectors'] : ['data', 'selectors'];
                                                const updatedSelectors = [...actualData.data.selectors];
                                                updatedSelectors[idx] = { ...updatedSelectors[idx], locator: newValue };
                                                updateNestedData(path, updatedSelectors);
                                            }}
                                            onDelete={() => {
                                                const path = value.stepData ? ['stepData', 'data', 'selectors'] : ['data', 'selectors'];
                                                const updatedSelectors = actualData.data.selectors.filter((_: any, index: number) => index !== idx);
                                                updateNestedData(path, updatedSelectors);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {processedData.hasAttributes && (
                        <div className={getPanelContainerClasses()}>
                            <DropdownHeader label="Attributes" panelKey="attributes" />
                            {openPanels.attributes && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(actualData.data.attributes).map(([key, val]) => (
                                        <FieldEditor
                                            key={key}
                                            label={key}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'data', 'attributes', key] : ['data', 'attributes', key], newValue)}
                                            onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'data', 'attributes', key] : ['data', 'attributes', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasCoordinates && (
                        <div className={getPanelContainerClasses()}>
                            <DropdownHeader label="Coordinates" panelKey="coordinates" />
                            {openPanels.coordinates && (
                                <div className="p-4 space-y-3">
                                    {Object.entries(actualData.data.coordinates).map(([key, val]) => (
                                        <FieldEditor
                                            key={key}
                                            label={key}
                                            fieldValue={val}
                                            onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'data', 'coordinates', key] : ['data', 'coordinates', key], newValue)}
                                            onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'data', 'coordinates', key] : ['data', 'coordinates', key])}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {processedData.hasImage && (
                        <div className={getPanelContainerClasses()}>
                            <DropdownHeader label="Image" panelKey="image" />
                            {openPanels.image && (
                                <DisplayImageWithFetch 
                                    src={actualData.data.image} 
                                    alt="Interaction Image" 
                                    isDarkMode={isDarkMode}
                                />
                            )}
                        </div>
                    )}

                    {processedData.hasTypeToAssert && (
                        <div className={`${getPanelContainerClasses()} p-4`}>
                            <FieldEditor
                                label="Type to Assert"
                                fieldValue={actualData?.typeAssert}
                                onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'typeAssert'] : ['typeAssert'], newValue)}
                                onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'typeAssert'] : ['typeAssert'])}
                            />
                        </div>
                    )}

                    {processedData.hasValueToAssert && (
                        <div className={`${getPanelContainerClasses()} p-4`}>
                            <FieldEditor
                                label="Value to Assert"
                                fieldValue={actualData?.valueToAssert}
                                onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'valueToAssert'] : ['valueToAssert'], newValue)}
                                onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'valueToAssert'] : ['valueToAssert'])}
                            />
                        </div>
                    )}

                    {processedData.hasText && (
                        <div className={`${getPanelContainerClasses()} p-4`}>
                            <FieldEditor
                                label="Text"
                                fieldValue={actualData.data?.text || actualData.text}
                                onUpdate={(newValue) => {
                                    if (actualData.data?.text !== undefined) {
                                        updateNestedData(value.stepData ? ['stepData', 'data', 'text'] : ['data', 'text'], newValue);
                                    } else {
                                        updateNestedData(value.stepData ? ['stepData', 'text'] : ['text'], newValue);
                                    }
                                }}
                                onDelete={() => {
                                    if (actualData.data?.text !== undefined) {
                                        deleteNestedProperty(value.stepData ? ['stepData', 'data', 'text'] : ['data', 'text']);
                                    } else {
                                        deleteNestedProperty(value.stepData ? ['stepData', 'text'] : ['text']);
                                    }
                                }}
                            />
                        </div>
                    )}

                    {processedData.hasTimeStamp && (
                        <div className={`${getPanelContainerClasses()} p-4`}>
                            <FieldEditor
                                label="Timestamp"
                                fieldValue={actualData?.data?.timeStamp}
                                onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'data', 'timeStamp'] : ['data', 'timeStamp'], newValue)}
                                onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'data', 'timeStamp'] : ['data', 'timeStamp'])}
                            />
                        </div>
                    )}

                    {processedData.hasPageIndex && (
                        <div className={`${getPanelContainerClasses()} p-4`}>
                            <FieldEditor
                                label="Page Index"
                                fieldValue={actualData?.pageIndex}
                                onUpdate={(newValue) => updateNestedData(value.stepData ? ['stepData', 'pageIndex'] : ['pageIndex'], newValue)}
                                onDelete={() => deleteNestedProperty(value.stepData ? ['stepData', 'pageIndex'] : ['pageIndex'])}
                            />
                        </div>
                    )}

                    <div className={getPanelContainerClasses()}>
                        <DropdownHeader label="JSON Preview" panelKey="jsonPreview" />
                        {openPanels.jsonPreview && (
                            <div className="pt-2">
                                {!editingJson ? (
                                    <>
                                        <pre className={getJSONPreviewClasses()}>
                                            <code>{jsonValue}</code>
                                        </pre>
                                        <button
                                            className={getEditButtonClasses()}
                                            onClick={() => setEditingJson(true)}
                                        >
                                            <FaEdit className="w-4 h-4"/> Edit JSON
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <textarea
                                            className={getTextareaClasses()}
                                            value={jsonValue}
                                            onChange={e => setJsonValue(e.target.value)}
                                            autoFocus
                                            spellCheck={false}
                                        />
                                        {jsonError && (
                                            <div className={getErrorTextClasses()}>{jsonError}</div>
                                        )}
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                className={getSaveButtonClasses()}
                                                onClick={handleSave}
                                            >
                                                <Save className="w-4 h-4"/> Save
                                            </button>
                                            <button
                                                className={getCancelButtonClasses()}
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


const ReusableStepsBlock = ({
    data,
    isDarkMode = false,
    onUpdate,
    onDelete,
    test,
    setTestCasesData,
    setResponseTest
}: {
    data: InteractionItemData;
    isDarkMode?: boolean;
    onUpdate?: (updatedData: InteractionItemData) => void;
    onDelete?: () => void;
    test?: any;
    setTestCasesData?: React.Dispatch<React.SetStateAction<any[]>>;
    setResponseTest?: React.Dispatch<React.SetStateAction<any>>;
}) => {
    const getReusableContainerClasses = () => isDarkMode
        ? "relative flex flex-col gap-3 py-4 px-3 text-slate-300 rounded-lg border-2 border-dashed border-amber-500/60 bg-gradient-to-r from-amber-900/20 to-orange-900/20 shadow-lg backdrop-blur-sm"
        : "relative max-h-[480px] overflow-y-auto flex flex-col gap-3 py-4 px-3 text-gray-700 rounded-lg border-2 border-dashed border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg";

    const getReusableHeaderClasses = () => isDarkMode
        ? "absolute top-0 left-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 text-sm font-bold rounded-tl-lg rounded-br-full shadow-lg border border-amber-500/50"
        : "absolute top-0 left-0 bg-gradient-to-r from-primary/90 to-primary/70 text-white px-4 py-2 text-sm font-bold rounded-tl-lg rounded-br-full shadow-lg";

    const getReusableStepClasses = () => isDarkMode
        ? "ml-4 pl-4 border-l-2 border-slate-500/50 bg-slate-800/30 rounded-r-lg p-2"
        : "ml-4 pl-4 border-l-2 border-amber-300 bg-white/60 rounded-r-lg p-2";

    const updateReusableStepsData = (newStepsData: any[]) => {
        if (onUpdate) {
            const updatedData = { 
                ...data, 
                stepsData: newStepsData.map((step, index) => ({
                    ...step,
                    indexStep: index + 1
                }))
            };
            onUpdate(updatedData);
        }
    };

    const handleStepInsertion = (insertIndex: number, newStep: any) => {
        const currentSteps = data.stepsData || [];
        const newStepsData = [...currentSteps];
        newStepsData.splice(insertIndex + 1, 0, {
            ...newStep,
            id: `${Date.now()}-${Math.random()}`,
            indexStep: insertIndex + 2
        });
        
        const reindexedSteps = newStepsData.map((step, index) => ({
            ...step,
            indexStep: index + 1
        }));
        
        updateReusableStepsData(reindexedSteps);
    };

    const customSetTestCasesData = React.useCallback((updateFunction: any) => {
        if (typeof updateFunction === 'function') {
            const mockTestCasesArray = [{
                ...test,
                stepsData: data.stepsData || []
            }];
            
            const updatedArray = updateFunction(mockTestCasesArray);
            
            if (updatedArray && updatedArray[0] && updatedArray[0].stepsData) {
                updateReusableStepsData(updatedArray[0].stepsData);
            }
        } else if (Array.isArray(updateFunction)) {
            if (updateFunction.length > 0 && updateFunction[0].stepsData) {
                updateReusableStepsData(updateFunction[0].stepsData);
            }
        }
    }, [data.stepsData, test, onUpdate]);

    const customSetResponseTest = React.useCallback((updateFunction: any) => {
        if (typeof updateFunction === 'function') {
            const mockResponse = {
                stepsData: data.stepsData || []
            };
            
            const updatedResponse = updateFunction(mockResponse);
            
            if (updatedResponse && updatedResponse.stepsData) {
                updateReusableStepsData(updatedResponse.stepsData);
            }
        }
    }, [data.stepsData, onUpdate]);

    return (
        <div className={getReusableContainerClasses()}>
            
            
            <div className={getReusableHeaderClasses()}>🔄 REUSABLE: {data.name || 'Unnamed Step'}</div>
            
            

            <div className="mt-6">
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'} mb-3`}>
                    <p><strong>Description:</strong> {data.description || 'No description'}</p>
                    <p><strong>Type:</strong> {data.type}</p>
                    <p><strong>Steps Count:</strong> {data.stepsData?.length || 0}</p>
                </div>

                <div className="space-y-3">

                    {data.stepsData?.map((step: any, idx: number) => (
                        <div key={step.id || idx} className={getReusableStepClasses()}>

                            <InteractionItem
                                data={step}
                                index={idx}
                                isDarkMode={isDarkMode}
                                onUpdate={(stepIndex, updatedStep) => {
                                    const newStepsData = [...(data.stepsData || [])];
                                    newStepsData[stepIndex] = updatedStep;
                                    updateReusableStepsData(newStepsData);
                                }}
                                onDelete={() => {
                                    const newStepsData = (data.stepsData || []).filter((_, i) => i !== idx);
                                    updateReusableStepsData(newStepsData);
                                }}
                                test={test}
                                setTestCasesData={customSetTestCasesData}
                                setResponseTest={customSetResponseTest}
                                showDelete={false}
                            />

                        </div>
                    ))}
                </div>

                <div className={`absolute top-2 right-2 flex gap-2 items-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    {onDelete && <DeleteButton onClick={onDelete} isDarkMode={isDarkMode} />}
                    <CopyToClipboard text={JSON.stringify(data)} isDarkMode={isDarkMode}/>
                </div>
            </div>
        </div>
    );
};

const InteractionItem = ({ data, index, onDelete, onUpdate,showDelete=true, isDarkMode = false, ...rest}: InteractionItemProps) => {
    const isReusableStep = data.type?.startsWith('STEPS') && Array.isArray(data.stepsData);

    if (isReusableStep) {
        return (
            <ReusableStepsBlock
                data={data}
                isDarkMode={isDarkMode}
                // onUpdate={(updatedData) => onUpdate?.(index, updatedData)}
                onDelete={() => onDelete?.(index)}
                {...rest}
            />
        );
    }

    const actualStepData = data.stepData || data;

    const getMainContainerClasses = () => isDarkMode
        ? "relative flex flex-col gap-2 py-2 px-1 text-slate-400 rounded-md border-l-4 border-slate-500 bg-slate-800/90 shadow-lg transition-all duration-300 hover:bg-slate-800"
        : "relative flex flex-col gap-2 py-2 px-1 text-primary rounded-md border-l-4 border-1 border-primary shadow-lg transition-all duration-300";

    const getStepNumberClasses = () => isDarkMode
        ? "absolute top-0 left-0 bg-slate-600 text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md"
        : "absolute top-0 left-0 bg-primary text-white px-3 py-1 text-sm font-semibold rounded-tl-xl rounded-br-full shadow-md";

    const getPageIndexClasses = () => isDarkMode ? "text-xs text-white/60" : "text-xs text-primary/80";

    console.log("InteractionItem data:", data.pageIndex);
    
    return (
        <div key={actualStepData.id || data.id} data-index={index} className="flex flex-col gap-4">
            <div className={getMainContainerClasses()}>
                <div className="flex justify-center items-center w-full">
                    <div className={`flex flex-col ${isDarkMode ? 'text-slate-300' : 'text-gray-700'} gap-1`}>
                        <p className="font-semibold text-center">{actualStepData.action}</p>
                        <p className="font-normal text-center">
                            {actualStepData?.data?.text || 
                             actualStepData?.data?.attributes?.name || 
                             actualStepData?.data?.attributes?.placeholder || 
                             actualStepData?.data?.attributes?.["aria-label"] ||
                             data.name}
                        </p>
                    </div>
                    <div className={getStepNumberClasses()}>{actualStepData.indexStep || data.indexStep}</div>

                    <div className={`absolute top-0 right-0 flex gap-2 items-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        {onDelete && showDelete && <DeleteButton onClick={() => onDelete(index)} isDarkMode={isDarkMode}/>}
                        <CopyToClipboard text={JSON.stringify(data)} isDarkMode={isDarkMode}/>
                    </div>
                </div>

                <JSONBox
                    value={data}
                    onChange={(newData) => {
                        const updatedData = JSON.parse(JSON.stringify(newData));
                        onUpdate?.(index, updatedData);
                    }}
                    isDarkMode={isDarkMode}
                />
                {(actualStepData?.hasOwnProperty('pageIndex') || data?.hasOwnProperty('pageIndex')) && (
                    <span className={getPageIndexClasses()}>
                        Page index: {data?.pageIndex}
                    </span>
                )}
            </div>
        </div>
    );
};

export default InteractionItem;