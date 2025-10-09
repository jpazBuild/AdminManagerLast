import { formatExecutionTime } from "@/lib/formatExecutionTime";
import jsPDF from "jspdf";
import { Chart, registerables } from "chart.js";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

Chart.register(...registerables);

interface TestData {
  data: {
    [testCaseId: string]: Record<string, any>;
  };
}

const getImageDataURLFromURL = async (url: string): Promise<string | null> => {
  const loadImageViaCanvas = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL("image/png");
          resolve(dataURL);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const loadImageViaFetch = async (): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === "string" ? reader.result : null);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const canvasResult = await loadImageViaCanvas();
  if (canvasResult) return canvasResult;

  return await loadImageViaFetch();
};

export const handleDownloadPDFReport = async (
  totalTests: number,
  totalSuccess: number,
  totalFailed: number,
  totalExecutionTime: number,
  reports: any[] = [],
  testData: TestData,
  selectedTest?: any
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
  doc.text(
    `Execution Time: ${formatExecutionTime(totalExecutionTime)}`,
    105,
    51,
    { align: "center" }
  );

  let currentY = 60;

  const successPercentage =
    totalTests > 0 ? Math.round((totalSuccess / totalTests) * 100) : 0;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 300;
  tempCanvas.height = 300;
  tempCanvas.style.position = "absolute";
  tempCanvas.style.left = "-10000px";
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

  await new Promise((res) => setTimeout(res, 300));

  const arc = chart.getDatasetMeta(0)?.data?.[0];
  if (arc && ctx) {
    ctx.save();
    ctx.fillStyle = primaryColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`${successPercentage}%`, arc.x, arc.y);
    ctx.restore();
  }

  const chartImage = await html2canvas(tempCanvas);
  const chartImageData = chartImage.toDataURL("image/png");
  document.body.removeChild(tempCanvas);
  chart.destroy();

  doc.addImage(chartImageData, "PNG", 65, currentY, 80, 80);
  currentY += 90;

  for (const [idx, report] of reports.entries()) {
    if (idx > 0) {
      const pageHeight = doc.internal.pageSize.height;
      const estimatedTestBlockHeight = 20;
      if (currentY + estimatedTestBlockHeight >= pageHeight) {
        doc.addPage();
        currentY = 5;
      } else {
        currentY += 2;
      }
    }

    const testCaseId = report.testCaseId || report.id;
    const testName = report.testCaseName || testCaseId;
    const test = selectedTest?.find((t: any) => t?.testCaseId === testCaseId);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text(test.testCaseName, 14, currentY);
    currentY += 6;

    const caseData = testData.data?.[testCaseId];
    if (caseData) {
      const lines = Object.entries(caseData).map(
        ([k, v]) => `• ${k}: ${v ?? "—"}`
      );

      doc.setFontSize(10);
      doc.text("Test Data:", 14, currentY + 6);
      let linesAdded = 0;

      lines.forEach((line) => {
        const parts = doc.splitTextToSize(line, 170);
        parts.forEach((part: string, j: number) => {
          doc.text(part, 18, currentY + 12 + (linesAdded + j) * 6);
        });
        linesAdded += parts.length;
      });

      currentY += linesAdded * 6 + 12;
    } else {
      currentY += 6;
    }

    const validSteps = report.data.filter(
      (step: any) =>
        step.action?.trim() &&
        (step.status || step.finalStatus || "") !== "processing"
    );

    const tableBody: any[] = [];

    for (const [i, step] of validSteps.entries()) {
      const status = step.status || step.finalStatus || "in_progress";
      const timeStr = step.time ? formatExecutionTime(step.time) : "-";
      const action = step.action || "—";
      const screenshot = step.screenshot?.trim();

      
      tableBody.push([String(i + 1), action, status, timeStr]);

      if (screenshot && screenshot?.startsWith("http")) {
        const imgDataUrl = await getImageDataURLFromURL(screenshot);
        if (imgDataUrl) {
          tableBody.push([
            {
              content: "",
              colSpan: 4,
              styles: {
                minCellHeight: 50,
                halign: "center",
                valign: "middle",
              },
              image: imgDataUrl,
              imageOptions: { width: 80, height: 40 },
            },
          ]);
        } else {
          tableBody.push([
            {
              content: "⚠ Unable to load image",
              colSpan: 4,
              styles: {
                halign: "center",
                valign: "middle",
                textColor: [200, 0, 0],
                fontStyle: "italic",
              },
            },
          ]);
        }
      }
    }

    autoTable(doc, {
      head: [["#", "Action", "Status", "Execution Time"]],
      body: tableBody,
      startY: currentY,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 10,
        overflow: "linebreak",
        cellPadding: 4,
      },
      columnStyles: {
        1: { cellWidth: 100 },
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: textColor,
        fontStyle: "bold",
      },
      didDrawCell: (data) => {
        const cell = data.cell;
        const raw = cell.raw;

        if (typeof raw === "object" && raw !== null && "image" in raw) {
          const opts = (raw as any).imageOptions || {};
          const x = cell.x + (cell.width - opts.width) / 2;
          const y = cell.y + 4;
          try {
            doc.addImage(
              (raw as any).image,
              "PNG",
              x,
              y,
              opts.width,
              opts.height
            );
          } catch (err) {
            console.warn("Failed to render image:", err);
          }
        }
      },
    });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  doc.save(`test-execution-report-${timestamp}.pdf`);
};


