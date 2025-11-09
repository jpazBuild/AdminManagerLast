import UnifiedInput from "@/app/components/Unified";
import { toEditable } from "@/utils/suiteUtils";
import { Loader2 } from "lucide-react";


type ShowDataProps = {
    isDarkMode: boolean;
    testId: string;
    test: any;
    full: any;
    dataBufById: Record<string, Record<string, any>>;
    setDataBufById: (buf: any) => void;
    handleSaveDynamicData: (testId: string, test: any) => void;
    savingDDById: Record<string, boolean>;
};


const ShowData = ({
    isDarkMode,
    testId,
    test,
    full,
    dataBufById,
    setDataBufById,
    handleSaveDynamicData,
    savingDDById,
}: ShowDataProps) => {
    return (
        <div className="w-full">
            <h3 className={`${isDarkMode ? "text-white/70" : "text-primary/70"} text-center mb-2 font-semibold text-lg`}>Dynamic Data</h3>
            <div className={`rounded-md border p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>

                {(() => {
                    const { keys } = toEditable(full);
                    const values = dataBufById[testId] || {};
                    return keys.map((k) => (
                        <div key={k} className="flex flex-col gap-6">
                            <UnifiedInput
                                id={`${testId}-${k}`}
                                value={values[k] ?? ""}
                                placeholder={`Enter ${k}`}
                                label={`Enter ${k}`}
                                isDarkMode={isDarkMode}
                                enableFaker
                                onChange={(val) =>
                                    setDataBufById((prev: any) => ({
                                        ...prev,
                                        [testId]: { ...(prev[testId] || {}), [k]: val },
                                    }))
                                }
                            />
                        </div>
                    ));
                })()}


            </div>
            <div className="flex justify-end mt-4">
                <button
                    onClick={() => handleSaveDynamicData(testId, test)}
                    disabled={!!savingDDById[testId]}
                    className={`px-4 py-2 flex items-center font-semibold gap-2 cursor-pointer rounded-md text-white ${isDarkMode ? "bg-primary-blue/70 hover:bg-primary-blue/80" : "hover:bg-primary/85 bg-primary/80"}`}
                >
                    {savingDDById[testId] ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>Save</>
                    )}
                </button>
            </div>


        </div>
    );
}

export default ShowData;