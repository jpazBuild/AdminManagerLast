import { formatExecutionTime } from "@/lib/formatExecutionTime";

interface TestStep {
  action: string;
  status?: string;
  finalStatus?: string;
  screenshot?: string;
  time?: number;
}

interface TestReport {
  testCaseId?: string;
  id?: string;
  testCaseName?: string;
  data: TestStep[];
}

interface TestDataType {
  data: {
    [key: string]: Record<string, string | number | null>;
  };
}

interface SelectedTestItem {
  id?: string;
  testCaseId?: string;
  name?: string;
  description?: string;
}

const getStatusFromReport = (report: TestReport) => {
  const last = [...(report.data || [])].reverse()
    .find(s => s?.status || s?.finalStatus);
  const status = last?.status || last?.finalStatus || "processing";
  const action = last?.action || "";
  const isCompleted = action === "Test execution completed" && status === "completed";
  const isFailed = action === "Test execution failed" && status === "failed";
  return { isCompleted, isFailed, status };
};

const computeTotals = (reportsSubset: TestReport[]) => {
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalPending = 0;
  let totalExecutionTime = 0;

  console.log("🔍 Calculando totales para los reportes:", reportsSubset);
  
  for (const r of reportsSubset) {
    const { isCompleted, isFailed, status } = getStatusFromReport(r);
    if (isCompleted) totalSuccess++;
    else if (isFailed) totalFailed++;
    else totalPending++;
    
    const lastWithTime = [...(r?.data || [])].reverse().find(s => typeof s?.time === "number");
    
    totalExecutionTime += lastWithTime?.time || 0;
  }

  const totalTests = reportsSubset.length;
  return { totalSuccess, totalFailed, totalPending, totalTests, totalExecutionTime };
};

const buildStepsByReportHTML = (
  reportsSubset: TestReport[],
  testData?: TestDataType,
  selectedTest?: SelectedTestItem[]
) => {
  return reportsSubset.map((report: any, idx: number) => {
    const testCaseId = report?.testCaseId || report?.id;
    const testDataForCase = testData?.data?.[testCaseId];
    const test = selectedTest?.find((t: any) => (t?.id ?? t?.testCaseId) === testCaseId);
    console.log("🔍 Generando HTML para el test:", testCaseId, testDataForCase, report.data);
    
    const testDataHTML = testDataForCase
      ? `<div class="test-data-block" style="margin: 10px 0 10px 10px; display: flex; flex-direction: column; gap: 4px;">
            <strong style="color: #223853; word-break: break-word;">${test?.name ?? ""}</strong>
            ${test?.description ? `<p style="color: #223853; word-break: break-word;">Description: ${test.description}</p>` : ""}
            <strong style="color: #223853; word-break: break-word;">🔧 Test Data:</strong>
            <ul style="margin-top: 4px;">
              ${Object.entries(testDataForCase).map(
                ([key, value]) => `<li><strong style="color: #223853; word-break: break-word;">${key}:</strong> ${value ?? "—"}</li>`
              ).join("")}
            </ul>
         </div>`
      : "";

    const stepsHTML = (report.data || [])
      .filter(
        (step: TestStep) =>
          !!step.action &&
          step.action.trim() !== "" &&
          (step.status || step.finalStatus || "") !== "processing"
      )
      .map((step: TestStep, i: number) => {
        const status = step.status || step.finalStatus || "in_progress";
        const hasImg = typeof step.screenshot === "string" && step.screenshot.trim() !== "";
        const imageTag = hasImg
          ? `<div><img src="${step.screenshot}" alt="step image"
              style="max-width:200px; max-height:120px; border:1px solid #ccc; margin-top:5px; cursor: pointer;"
              onclick="showImageModal('${step.screenshot}')" /></div>`
          : "";

        
        return `
          <tr>
            <td>${i + 1}</td>
            <td>${step.action}${imageTag}</td>
            <td>${status}</td>
            <td>${formatExecutionTime(Number(step?.time) ?? 0)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="dropdown-block">
        <button class="dropdown-toggle" onclick="toggleDropdown('report-${idx}')">
          ▶ ${report.testCaseName || report.testCaseId || testCaseId}
        </button>
        <div class="dropdown-content" id="report-${idx}">
          ${testDataHTML}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Status</th>
                <th>Execution Time</th>
              </tr>
            </thead>
            <tbody>${stepsHTML}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join("");
};

const buildHTML = (
  totals: { totalSuccess: number; totalFailed: number; totalTests: number; totalExecutionTime: number; },
  stepsHTML: string
) => {
  const chartData = {
    labels: ["Success", "Failed"],
    datasets: [{ data: [totals.totalSuccess, totals.totalFailed], backgroundColor: ["#4CAF50", "#F44336"] }],
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Test Execution Report</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; background: #f9f9f9; color: #333; }
        h1, h2, h3 { color: #223853; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 0.75rem; border: 1px solid #ccc; text-align: left; vertical-align: top; }
        th { background-color: #eee; }
        .chart-container { max-width: 400px; margin: 2rem auto; }
        .dropdown-block { margin-bottom: 1.5rem; }
        .dropdown-toggle {
          background: #223853; color: white; padding: 0.6rem 1rem; font-weight: bold; border: none; cursor: pointer;
          border-radius: 4px; width: 100%; text-align: left; font-size: 1rem;
        }
        .dropdown-content { display: none; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; background: white; margin-top: 0.5rem; }
        img { display: block; margin-top: 6px; }
      </style>
    </head>
    <body>
      <h1>Test Execution Summary</h1>
      <div class="chart-container">
        <canvas id="resultChart"></canvas>
      </div>
      <script>
        const data = ${JSON.stringify(chartData)};
        const config = { type: 'pie', data, options: { plugins: { legend: { position: 'bottom' } } } };
        window.onload = function () { new Chart(document.getElementById('resultChart'), config); };

        function toggleDropdown(id) {
          const el = document.getElementById(id);
          el.style.display = (el.style.display === "block") ? "none" : "block";
        }
        function showImageModal(src) {
          const modal = document.getElementById("imageModal");
          const modalImg = document.getElementById("modalImage");
          modalImg.src = src;
          modal.style.display = "flex";
        }
        function closeImageModal() {
          const modal = document.getElementById("imageModal");
          modal.style.display = "none";
          document.getElementById("modalImage").src = '';
        }
      </script>

      <p><strong>Total Tests:</strong> ${totals.totalTests}</p>
      <p><strong>Success:</strong> ${totals.totalSuccess}</p>
      <p><strong>Failed:</strong> ${totals.totalFailed}</p>
      <p><strong>Execution Time:</strong> ${formatExecutionTime(totals.totalExecutionTime)}</p>

      <h2>Detailed Steps Per Test</h2>
      ${stepsHTML}

      <div id="imageModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;
          background: rgba(0, 0, 0, 0.85); justify-content: center; align-items: center; z-index:9999;">
        <span onclick="closeImageModal()" style="position:absolute; top:20px; right:30px; color:white; font-size:2rem; cursor:pointer;">&times;</span>
        <img id="modalImage" src="" style="max-width:90%; max-height:90%; border:4px solid white; border-radius:8px;" />
      </div>
    </body>
    </html>
  `;
};

const downloadHTML = (html: string, filename = "test-execution-report.html") => {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const handleDownloadHTMLReport = (
  totalSuccess: number,
  totalFailed: number,
  totalTests: number,
  totalExecutionTime: number,
  reports: TestReport[],
  testData?: TestDataType,
  selectedTest?: SelectedTestItem[]
) => {
  const subsetTotals = (totalTests ?? 0) > 0
    ? { totalSuccess, totalFailed, totalTests, totalExecutionTime }
    : computeTotals(reports);

  const stepsHTML = buildStepsByReportHTML(reports, testData, selectedTest);
  const html = buildHTML(subsetTotals, stepsHTML);
  downloadHTML(html);
};

export const handleDownloadHTMLReportSingle = (
  testCaseId: string,
  reports: TestReport[],
  testData?: TestDataType,
  selectedTest?: SelectedTestItem[]
) => {
  const subset = reports.filter(r => (r.testCaseId || r.id) === testCaseId);
  console.log("🔍 Generando HTML para el test individual: subset", testCaseId, subset);
  
  const totals = computeTotals(subset);
  const stepsHTML = buildStepsByReportHTML(subset, testData, selectedTest);
  const html = buildHTML(totals, stepsHTML);
  downloadHTML(html, `test-report-${testCaseId}.html`);
};