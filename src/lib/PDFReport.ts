import { formatExecutionTime } from "@/lib/formatExecutionTime";
import jsPDF from "jspdf";
import { Chart, registerables } from 'chart.js';
import autoTable from "jspdf-autotable";
import html2canvas from 'html2canvas';
Chart.register(...registerables);

interface TestData {
  data: {
    [testCaseId: string]: Record<string, any>;
  };
}

export const handleDownloadPDFReport = async (
  totalTests: number,
  totalSuccess: number,
  totalFailed: number,
  totalExecutionTime: number,
  reports: any[] = [],
  testData: TestData
) => {
    const doc = new jsPDF();

    const primaryColor = "#223853";
    const textColor = "#FFFFFF";

    doc.setTextColor(primaryColor);
    doc.setFontSize(18);
    doc.text("Test Execution Report", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Total Tests: ${totalTests}`, 105, 30, { align: "center" });
    doc.text(`Success: ${totalSuccess}`, 105, 37, { align: "center" });
    doc.text(`Failed: ${totalFailed}`, 105, 44, { align: "center" });
    doc.text(`Execution Time: ${formatExecutionTime(totalExecutionTime)}`, 105, 51, { align: "center" });

    let currentY = 60;

    const successPercentage = totalTests > 0 ? Math.round((totalSuccess / totalTests) * 100) : 0;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.id = "pdf-chart";
    tempCanvas.style.position = "absolute";
    tempCanvas.style.left = "-10000px";
    tempCanvas.width = 300;
    tempCanvas.height = 300;
    document.body.appendChild(tempCanvas);

    const ctx = tempCanvas.getContext("2d");

    const chart = new Chart(ctx!, {
    type: "doughnut",
    data: {
        labels: ["Success", "Failed"],
        datasets: [
        {
            data: [totalSuccess, totalFailed],
            backgroundColor: ["#4CAF50", "#F44336"],
            borderWidth: 1,
        },
        ],
    },
    options: {
        responsive: false,
        animation: false,
        plugins: {
        legend: {
            display: true,
            position: "bottom",
        },
        },
    },
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const meta = chart.getDatasetMeta(0);
    const arc = meta?.data?.[0];
    if (arc && arc.x && arc.y) {
      const centerX = arc.x;
      const centerY = arc.y;
    
      if (ctx) {
          ctx.save();
          ctx.fillStyle = "#223853";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold 24px Arial";
          ctx.fillText(`${successPercentage}%`, centerX, centerY);
          ctx.restore();
      }
    }
    
    const chartImageCanvas = await html2canvas(tempCanvas);
    const chartImageData = chartImageCanvas.toDataURL("image/png");

    const chartWidth = 80;
    const chartHeight = 80;
    const chartX = (doc.internal.pageSize.getWidth() - chartWidth) / 2;
    doc.addImage(chartImageData, "PNG", chartX, currentY, chartWidth, chartHeight);

    chart.destroy();
    document.body.removeChild(tempCanvas);

    currentY += chartHeight + 10;

    reports.forEach((report: any, idx: number) => {
        const validSteps = report.data.filter((step: any) =>
            !!step.action &&
            step.action.trim() !== '' &&
            (step.status || step.finalStatus || '') !== 'processing'
        );

        if (idx > 0) {
            doc.addPage();
            currentY = 20;
        }

        doc.setTextColor(primaryColor);
        doc.setFontSize(14);
        doc.text(`${report.testCaseName || report.testCaseId}`, 14, currentY);
        currentY += 6;

        const testCaseId = report.testCaseId || report.id;
        const testDataForCase = testData?.data[testCaseId];
        console.log("testDataForCase", testDataForCase);

        if (testDataForCase && typeof testDataForCase === "object") {
            const testDataLines = Object.entries(testDataForCase).map(
                ([key, value]) => `• ${key}: ${value || '—'}`
            );
        
            doc.setFontSize(10);
            doc.setTextColor(primaryColor);
            doc.text("Test Data:", 14, currentY + 6);
        
            let linesAdded = 0;
            testDataLines.forEach((line) => {
                const splitted = doc.splitTextToSize(line, 170);
                splitted.forEach((part, j) => {
                    doc.text(part, 18, currentY + 12 + (linesAdded + j) * 6);
                });
                linesAdded += splitted.length;
            });
        
            currentY += linesAdded * 6 + 12;
        } else {
            currentY += 6;
        }
        

        const tableBody: any[] = [];

        validSteps.forEach((step: any, i: number) => {
            const status = step.status || step.finalStatus || "in_progress";
            const timeStr = step.time ? formatExecutionTime(step.time) : "-";
            const action = step.action || "—";
            const screenshot = step.screenshot?.trim();

            tableBody.push([String(i + 1), action, status, timeStr]);

            if (screenshot && screenshot.startsWith("iVBOR")) {
                const base64Image = `data:image/png;base64,${screenshot}`;
                tableBody.push([
                    {
                        content: '',
                        colSpan: 4,
                        styles: {
                            minCellHeight: 50,
                            halign: 'center',
                            valign: 'middle',
                        },
                        image: base64Image,
                        imageOptions: { width: 80, height: 40, align: 'center' },
                    },
                ]);
            }
        });

        autoTable(doc, {
            head: [["#", "Action", "Status", "Execution Time"]],
            body: tableBody,
            startY: currentY,
            margin: { top: 10, left: 14, right: 14 },
            rowPageBreak: 'avoid',
            styles: {
                fontSize: 10,
                overflow: 'linebreak',
                cellPadding: 4,
            },
            columnStyles: {
                1: { cellWidth: 100 },
            },
            headStyles: {
                fillColor: primaryColor,
                textColor: textColor,
                fontStyle: 'bold',
            },
            didDrawCell: (data) => {
                const cell = data.cell;
                const cellData: any = cell.raw;

                if (cellData && typeof cellData === 'object' && cellData.image) {
                    const imageOptions = cellData.imageOptions || {};
                    const x = data.cell.x + (data.cell.width - imageOptions.width) / 2;
                    const y = data.cell.y + 4;

                    try {
                        doc.addImage(
                            cellData.image,
                            "PNG",
                            x,
                            y,
                            imageOptions.width,
                            imageOptions.height
                        );
                    } catch (err) {
                        console.warn("Error inserting image:", err);
                    }
                }
            },
        });
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`test-execution-report-${timestamp}.pdf`);
};