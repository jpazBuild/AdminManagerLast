export const buildStandaloneHtml = (options: {
  file?: any;
  bodyInnerHtml: string;
  extraHeadHtml?: string;
  appCss?: string;
  header?: any;
}) => {
  const { file = "Export", bodyInnerHtml, extraHeadHtml = "", appCss = "", header } = options;

  const cssVars = `
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --card: 0 0% 100%;
      --card-foreground: 240 10% 3.9%;
      --primary: #223854;
      --primary-foreground: 210 40% 98%;
      --secondary: 240 4.8% 95.9%;
      --muted: 240 4.8% 95.9%;
      --muted-foreground: 240 3.8% 46.1%;
      --accent: 240 4.8% 95.9%;
      --destructive: 0 72% 51%;
      --border: 240 5.9% 90%;
      --input: 240 5.9% 90%;
      --ring: 221.2 83.2% 53.3%;
      --radius: 0.5rem;
    }

    /* ¡Clave para que el PDF respete colores! */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      color: #374151;
      background-color: #f8fafc;
      padding: 1rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .report-header {
      background: var(--primary);
      color: white;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .report-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .timestamp { color: rgba(255,255,255,0.9); font-size: .875rem; font-weight: 400; }
    .report-content { padding: 1.5rem; background: #f8fafc; }

    .step-card, [class*="border-green-500"], [class*="border-red-500"], [class*="border-2"]{
      position: relative; border: 3px solid #10b981; border-radius: 8px; margin-bottom: 1rem;
      overflow: visible; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 0;
      page-break-inside: avoid;
    }
    .step-card.failed,[class*="border-red-500"]{ border-color:#ef4444 !important; }
    .step-card.completed,[class*="border-green-500"]{ border-color:#10b981 !important; }

    .step-number-badge,[class*="bg-primary"][class*="absolute"],.step-card>div:first-child[class*="absolute"]{
      position:absolute !important; top:0!important; left:0!important; background:#223854!important;
      color:white!important; padding:.5rem .75rem!important; font-size:.875rem!important; font-weight:600!important;
      border-top-left-radius:6px!important; border-bottom-right-radius:20px!important; z-index:10!important;
      box-shadow:0 2px 4px rgba(0,0,0,0.2)!important;
    }

    .step-body,.step-card>div:not(:first-child),[class*="p-4"]{
      padding:1.5rem 1.25rem 1.25rem 1.25rem!important; background:white; min-height:60px;
    }

    .step-description,.step-card p:first-of-type,[class*="text-md"][class*="mt-6"]{
      color:#223854!important; font-size:.95rem!important; font-weight:600!important; margin-top:1.5rem!important;
      margin-bottom:1rem!important; word-wrap:break-word; line-height:1.4;
    }

    .step-time,[class*="absolute"][class*="top-2"][class*="right-2"]{
      position:absolute!important; top:.5rem!important; right:.5rem!important; color:#223854!important;
      font-size:.75rem!important; font-weight:500!important; display:flex!important; align-items:center!important;
      gap:.25rem!important; background:rgba(255,255,255,.9)!important; padding:.25rem .5rem!important;
      border-radius:4px!important; box-shadow:0 1px 3px rgba(0,0,0,0.1)!important;
    }
    .step-time svg,[class*="w-4"][class*="h-4"]{ width:14px!important; height:14px!important; }

    .step-detail,.step-card p:not(:first-of-type){ font-size:.875rem; margin-bottom:.5rem; line-height:1.5; word-wrap:break-word; }
    .step-detail strong{ font-weight:600; color:#374151; }
    [class*="text-red-500"]{ color:#ef4444!important; }

    .step-image-container,[class*="flex"][class*="justify-center"][class*="mt-4"]{
      margin-top:1.5rem!important; display:flex!important; justify-content:center!important;
    }
    .step-image-wrapper,[class*="relative"][class*="cursor-pointer"]{
      position:relative; cursor:pointer; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1); background:#f8fafc;
    }
    .step-image,[class*="rounded-lg"][class*="object-contain"]{
      width:100%!important; height:auto!important; max-width:320px!important; max-height:256px!important; object-fit:contain!important; border-radius:8px;
    }

    @media (max-width:768px){
      body{ padding:.5rem; }
      .report-header{ padding:1rem; flex-direction:column; gap:.5rem; text-align:center; }
      .report-title{ font-size:1.25rem; }
      .report-content{ padding:1rem; }
      .step-header{ padding:.75rem 1rem; flex-direction:column; gap:.5rem; align-items:flex-start; }
      .step-body{ padding:1rem; }
      .step-image{ max-height:300px; }
    }

    [class*="relative"][class*="cursor-pointer"]::before,[class*="relative"][class*="cursor-pointer"] svg{
      display:none!important; content:none!important;
    }

    /* PRINT */
    @page { size: A4; margin: 16mm; }
    @media print {
      html, body { background: white !important; }
      body { padding: 0 !important; }
      .container { box-shadow:none !important; border:1px solid #e5e7eb; }
      .step-card { break-inside: avoid; page-break-inside: avoid; margin-bottom: 1rem; }
      .report-content { background: white !important; }
    }
  `;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Test Execution Report - ${file?.id || 'Export'}</title>
  ${extraHeadHtml}
  <style id="theme-vars">${cssVars}</style>
  ${appCss ? `<style id="app-css">${appCss}</style>` : ""}
</head>
<body>
  <div class="container">
    <div class="report-header">
      <h1 class="report-title">Test Execution Report</h1>
      <div class="timestamp">${new Date().toLocaleString()}</div>
    </div>

    <div class="report-header">
      <h2>${header?.name ?? ""}</h2>
      <p class="report-header">ID: ${file?.id ?? ""}</p>
    </div>

    <div class="report-content">
      ${bodyInnerHtml}
    </div>
  </div>
</body>
</html>`;
};
