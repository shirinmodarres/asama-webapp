type ExcelCell = string | number | null | undefined;

type ExcelSheet = { name: string; rows: ExcelCell[][] };

function escapeXml(value: ExcelCell): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

function renderCell(value: ExcelCell): string {
  const type = typeof value === "number" && Number.isFinite(value) ? "Number" : "String";
  return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

export function downloadExcelFile(filename: string, sheets: ExcelSheet[]): void {
  const worksheets = sheets.map((sheet) => `
    <Worksheet ss:Name="${escapeXml(sheet.name)}"><Table>
      ${sheet.rows.map((row) => `<Row>${row.map(renderCell).join("")}</Row>`).join("")}
    </Table></Worksheet>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles><Style ss:ID="Default"><Alignment ss:ReadingOrder="RightToLeft"/></Style></Styles>${worksheets}
</Workbook>`;
  const blob = new Blob(["\uFEFF", xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
