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

export const handleDownloadHTMLReport = (
    totalSuccess: number,
    totalFailed: number,
    totalTests: number,
    totalExecutionTime: number,
    reports: TestReport[],
    testData?: TestDataType,
    selectedTest?:any
) => {
  console.log("selectedTest :", selectedTest);
  
    const chartData = {
        labels: ['Success', 'Failed'],
        datasets: [{
            data: [totalSuccess, totalFailed],
            backgroundColor: ['#4CAF50', '#F44336']
        }]
    };

    const stepsByReportHTML = reports.map((report: any, idx: number) => {
        const testCaseId = report?.testCaseId || report?.id;
        const testDataForCase = testData?.data[testCaseId];
        const test = selectedTest?.find((test: any) => test?.testCaseId === testCaseId)

        const testDataHTML = testDataForCase
            ? `<div class="test-data-block" style="margin: 10px 0 10px 10px; display: flex; flex-direction: column; gap: 4px;">
                  <strong style="color: #223853; word-break: break-word;">${test?.testCaseName}</strong>
                  <p style="color: #223853; word-break: break-word;">Description: ${test?.testCaseDescription}</p>
                  <strong style="color: #223853; word-break: break-word;">🔧 Test Data:</strong>
                  <ul style="margin-top: 4px;">
                    ${Object.entries(testDataForCase).map(
                        ([key, value]) => `<li><strong style="color: #223853; word-break: break-word;">${key}:</strong> ${value || '—'}</li>`
                    ).join("")}
                  </ul>
               </div>`
            : '';
    
        const stepsHTML = report.data
            .filter((step: any) =>
                !!step.action &&
                step.action.trim() !== '' &&
                (step.status || step.finalStatus || '') !== 'processing'
            )
            .map((step: any, i: number) => {
                const status = step.status || step.finalStatus || "in_progress";
                const isBase64 = typeof step.screenshot === 'string' && step.screenshot.trim() !== '';
                // const base64Image = isBase64 ? `data:image/png;base64,${step.screenshot}` : '';
                const imageTag = isBase64
                    ? `<div><img src="${step.screenshot}" alt="step image"
                        style="max-width:200px; max-height:120px; border:1px solid #ccc; margin-top:5px; cursor: pointer;"
                        onclick="showImageModal('${step.screenshot}')" /></div>`
                    : '';
    
                return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${step.action}${imageTag}</td>
                    <td>${status}</td>
                    <td>${step.time ? formatExecutionTime(step.time) : "-"}</td>
                  </tr>
                `;
            }).join("");
    
        return `
          <div class="dropdown-block">
            <button class="dropdown-toggle" onclick="toggleDropdown('report-${idx}')">
              ▶ ${report.testCaseName || report.testCaseId}
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
    

    const reportHTML = `
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
          .success { background-color: #e8f5e9; }
          .failed { background-color: #ffebee; }
          .chart-container { max-width: 400px; margin: 2rem auto; }
  
          .dropdown-block { margin-bottom: 1.5rem; }
          .dropdown-toggle {
            background: #223853;
            color: white;
            padding: 0.6rem 1rem;
            font-weight: bold;
            border: none;
            cursor: pointer;
            border-radius: 4px;
            width: 100%;
            text-align: left;
            font-size: 1rem;
          }
          .dropdown-content {
            display: none;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            margin-top: 0.5rem;
          }
          img {
            display: block;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <h1>Test Execution Summary</h1>
        <div class="chart-container">
          <canvas id="resultChart"></canvas>
        </div>
        <script>
          const data = ${JSON.stringify(chartData)};
          const config = {
            type: 'pie',
            data: data,
            options: {
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          };
          window.onload = function () {
            new Chart(document.getElementById('resultChart'), config);
          };
  
          function toggleDropdown(id) {
            const el = document.getElementById(id);
            if (el.style.display === "block") {
              el.style.display = "none";
            } else {
              el.style.display = "block";
            }
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
  
        <p><strong>Total Tests:</strong> ${totalTests}</p>
        <p><strong>Success:</strong> ${totalSuccess}</p>
        <p><strong>Failed:</strong> ${totalFailed}</p>
        <p><strong>Execution Time:</strong> ${formatExecutionTime(totalExecutionTime)}</p>
  
        <h2>Detailed Steps Per Test</h2>
        ${stepsByReportHTML}
        <div id="imageModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0, 0, 0, 0.85); justify-content: center; align-items: center; z-index:9999;">
        <span onclick="closeImageModal()"
                style="position:absolute; top:20px; right:30px; color:white; font-size:2rem; cursor:pointer;">&times;</span>
        <img id="modalImage" src="" style="max-width:90%; max-height:90%; border:4px solid white; border-radius:8px;" />
        </div>

      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-execution-report.html";
    a.click();
    URL.revokeObjectURL(url);
};