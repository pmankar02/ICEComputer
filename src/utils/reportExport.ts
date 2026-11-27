import * as XLSX from "xlsx";

export interface ExportSummaryItem {
  label: string;
  value: string | number;
}

export interface ExportReportOptions {
  title: string;
  fromDate?: string;
  toDate?: string;
  summary: ExportSummaryItem[];
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
}

function getDateRangeLabel(fromDate?: string, toDate?: string): string {
  if (fromDate && toDate) return `${fromDate} to ${toDate}`;
  if (fromDate) return `From ${fromDate}`;
  if (toDate) return `Up to ${toDate}`;
  return "All Dates";
}

export function exportReportToExcel(options: ExportReportOptions): void {
  const generatedAt = new Date().toLocaleString("en-IN");
  const dateRange = getDateRangeLabel(options.fromDate, options.toDate);

  const sheetData: (string | number)[][] = [
    ["ICE Computer Institute"],
    [options.title],
    [`Date Range: ${dateRange}`, `Generated: ${generatedAt}`],
    [],
    ["Summary"],
    ...options.summary.map((s) => [s.label, s.value]),
    [],
    options.headers,
    ...options.rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${options.fileName}.xlsx`);
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printOrExportPdfReport(options: ExportReportOptions): void {
  const generatedAt = new Date().toLocaleString("en-IN");
  const dateRange = getDateRangeLabel(options.fromDate, options.toDate);

  const summaryHtml = options.summary
    .map(
      (item) => `
      <div class="summary-box">
        <div class="summary-label">${escapeHtml(item.label)}</div>
        <div class="summary-val">${escapeHtml(item.value)}</div>
      </div>`
    )
    .join("");

  const headerHtml = options.headers
    .map((h) => `<th>${escapeHtml(h)}</th>`)
    .join("");

  const rowsHtml =
    options.rows.length > 0
      ? options.rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
          )
          .join("")
      : `<tr><td colspan="${options.headers.length}" style="text-align:center;color:#64748b;">No records found for selected filters.</td></tr>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.title)} - ICE Computer Institute</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
    .institute { font-size: 22px; font-weight: 800; color: #1d4ed8; margin: 0; }
    .report-title { font-size: 16px; font-weight: 700; margin: 4px 0 0; color: #0f172a; }
    .meta { text-align: right; font-size: 12px; color: #475569; line-height: 1.5; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 18px; }
    .summary-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
    .summary-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .summary-val { font-size: 16px; font-weight: 700; margin-top: 4px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #eff6ff; color: #1e3a8a; font-weight: 700; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="institute">ICE Computer Institute</h1>
      <div class="report-title">${escapeHtml(options.title)}</div>
    </div>
    <div class="meta">
      <div><strong>Date Range:</strong> ${escapeHtml(dateRange)}</div>
      <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
    </div>
  </div>
  <div class="summary-grid">${summaryHtml}</div>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    window.alert("Please allow pop-ups to print or save the report as PDF.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
