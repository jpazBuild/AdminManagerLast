import LoadingSkeleton from "@/app/components/loadingSkeleton";
import NoData from "@/app/components/NoData";
import StepCard from "@/app/components/StepCard";
import TestReports from "@/app/dashboard/components/TestReports";
import { X } from "lucide-react";

type ShowReportProps = {
  isDarkMode: boolean;
  testId: string;
  reportsTabById: Record<string, "live" | "saved">;
  setReportsTabById: (tabs: Record<string, "live" | "saved">) => void;
  historicById: Record<string, any[]>;
  historicMetaById: Record<string, { fetched: boolean; empty: boolean }>;
  fetchHistoricFor: (test: any, opts?: { force?: boolean }) => Promise<void>;
  suiteTests: any[];
  test: any;
  computedTestDataFor: any;
  reports: any[];
  idReports: any;
  progress: any;
  loadingHistoric: Record<string, boolean>;
  errorHistoric: Record<string, string | null>;
  handlePlaySingle: (test: any) => void;
  handleTestFinalStatus: (testId: any, status: any) => void;
  stopped: any;
  setStopped: (stopped: any) => void;
  setLoading: (loading: any) => void;
  loading: Record<string, boolean>;
  showData: Record<string, boolean>;
  setShowData: (showData: Record<string, boolean>) => void;
  showSteps: Record<string, boolean>;
  setShowSteps: (showSteps: Record<string, boolean>) => void;
  showReports: Record<string, boolean>;
  setShowReports: (showReports: Record<string, boolean>) => void;
  handleImageClick: (screenshotUrl: string) => void;
  stopAll: any;
  hasLiveFor: (testId: string) => boolean;
};

const ShowReport = ({
  isDarkMode,
  testId,
  reportsTabById,
  setReportsTabById,
  historicById,
  historicMetaById,
  fetchHistoricFor,
  suiteTests,
  test,
  computedTestDataFor,
  reports,
  idReports,
  progress,
  loadingHistoric,
  errorHistoric,
  handlePlaySingle,
  handleTestFinalStatus,
  stopped,
  setStopped,
  setLoading,
  loading,
  showData,
  setShowData,
  showSteps,
  setShowSteps,
  showReports,
  setShowReports,
  stopAll,
  handleImageClick,
  hasLiveFor,
}: ShowReportProps) => {
  return (
    <div className={`rounded-md border p-3 space-y-3 mt-4 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
      <h3 className={`${isDarkMode ? "text-white/70" : "text-primary/70"} text-center mb-2 font-semibold text-lg`}></h3>

      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-2">
          {hasLiveFor(testId) && (
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${(reportsTabById[testId] ?? "live") === "live"
                ? (isDarkMode ? "bg-primary-blue/70 text-white border-transparent" : "bg-primary text-white border-primary")
                : (isDarkMode ? "border-white/15 text-white/80" : "border-slate-300 text-primary/70")}`}
              onClick={() => {
                const next = { ...reportsTabById, [testId]: "live" as const };
                setReportsTabById(next);
              }}
            >
              Live
            </button>
          )}

          <button
            className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${(reportsTabById[testId] ?? (hasLiveFor(testId) ? "live" : "saved")) === "saved"
              ? (isDarkMode ? "bg-primary-blue/70 text-white border-transparent" : "bg-primary text-white border-primary")
              : (isDarkMode ? "border-white/15 text-white/80" : "border-slate-300 text-primary/70")}`}
            onClick={() => {
              const next = { ...reportsTabById, [testId]: "saved" as const };
              setReportsTabById(next);
              const meta = historicMetaById[testId];
              if (!meta?.fetched || meta?.empty) {
                const t = suiteTests.find((x) => String(x.id) === testId);
                if (t) fetchHistoricFor(t, { force: true });
              }
            }}
          >
            Saved
          </button>
        </div>

        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border ${isDarkMode ? "border-gray-700 hover:bg-gray-900" : "border-gray-300 hover:bg-gray-100"}`}
          onClick={() => {
            const nextData = { ...showData, [testId]: false };
            const nextSteps = { ...showSteps, [testId]: false };
            const nextReports = { ...showReports, [testId]: false };
            setShowData(nextData);
            setShowSteps(nextSteps);
            setShowReports(nextReports);
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {(() => {
        const activeTab = reportsTabById[testId] ?? (hasLiveFor(testId) ? "live" : "saved");
        if (activeTab === "live" && hasLiveFor(testId)) {
          return (
            <TestReports
              stopped={stopped}
              setStopped={setStopped}
              setLoading={setLoading}
              loading={loading}
              testData={computedTestDataFor}
              reports={reports}
              idReports={idReports}
              progress={progress}
              selectedCases={[test]}
              selectedTest={[test]}
              darkMode={isDarkMode}
              onPlayTest={handlePlaySingle}
              stopAll={stopAll}
              showOnlySingletest={true}
              onFinalStatus={handleTestFinalStatus}
            />
          );
        }
        return (
          <div className="space-y-3">
            {loadingHistoric[testId] && <LoadingSkeleton darkMode={isDarkMode} />}
            {!!errorHistoric[testId] && (
              <div className={isDarkMode ? "text-red-300" : "text-red-600"}>{errorHistoric[testId]}</div>
            )}
            {!loadingHistoric[testId] && !errorHistoric[testId] && (() => {
              const evs = (historicById[testId] || [])
                .slice()
                .sort((a, b) => (a.indexStep ?? 0) - (b.indexStep ?? 0));
              if (evs.length === 0) {
                return <NoData darkMode={isDarkMode} text="No historical reports found for this test." />;
              }
              return (
                <div className={`rounded-md border ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                  <div className={isDarkMode ? "bg-gray-900/40 p-2" : "bg-slate-50 p-2"}>
                    <div className="text-lg opacity-80 text-center">Report</div>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2 px-4">
                    {evs.map((e, i) => (
                      <StepCard
                        key={i}
                        step={e}
                        index={e.indexStep || i + 1}
                        darkMode={isDarkMode}
                        stepData={e.stepData}
                        handleImageClick={() => handleImageClick(e?.screenshot)}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}
    </div>
  );
};

export default ShowReport;
