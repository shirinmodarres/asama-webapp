import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";

export interface DraftUnit {
  rowId: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

export interface DuplicateWarehouseUnitDetail {
  field: "serialNumber" | "trackingCode";
  value: string;
  inputRowIndex: number;
  existingUnitId?: string | null;
  existingProductName?: string | null;
  existingStockTitle?: string | null;
  existingReceiptCode?: string | null;
  existingCreatedAt?: string | null;
}

export type UnitRowErrors = Record<
  string,
  Partial<Record<"productIdentifier" | "serialNumber" | "trackingCode", string>>
>;

export interface ImportSourceRow {
  excelRowNumber: number;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

export interface ImportPreviewRow extends ImportSourceRow {
  rowId: string;
  unitRowId?: string;
  messages: string[];
}

export async function parseInboundImportFile(
  file: File,
): Promise<ImportSourceRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    return parseGridRows(parseDelimitedText(await file.text(), name), 1);
  }

  if (!name.endsWith(".xlsx")) {
    throw new Error("فقط فایل‌های xlsx، csv یا tsv پشتیبانی می‌شوند.");
  }

  return parseXlsxRows(await file.arrayBuffer());
}

export function isEmptyImportRow(row: ImportSourceRow): boolean {
  return !row.productIdentifier && !row.serialNumber && !row.trackingCode;
}

export function buildLocalUnitRowErrors(units: DraftUnit[]): UnitRowErrors {
  const result: UnitRowErrors = {};
  const serialRows = new Map<string, string[]>();
  const trackingRows = new Map<string, string[]>();

  units.forEach((unit) => {
    if (!unit.productIdentifier) {
      result[unit.rowId] = {
        ...result[unit.rowId],
        productIdentifier: "این فیلد الزامی است.",
      };
    }
    if (!unit.trackingCode) {
      result[unit.rowId] = {
        ...result[unit.rowId],
        trackingCode: "این فیلد الزامی است.",
      };
    }
    if (unit.serialNumber) {
      const serial = normalizeDigits(unit.serialNumber.trim());
      serialRows.set(serial, [...(serialRows.get(serial) || []), unit.rowId]);
    }
    if (unit.trackingCode) {
      const tracking = normalizeDigits(unit.trackingCode.trim());
      trackingRows.set(tracking, [
        ...(trackingRows.get(tracking) || []),
        unit.rowId,
      ]);
    }
  });

  serialRows.forEach((rowIds) => {
    if (rowIds.length < 2) return;
    rowIds.forEach((rowId) => {
      result[rowId] = {
        ...result[rowId],
        serialNumber: "سریال کالا تکراری است.",
      };
    });
  });
  trackingRows.forEach((rowIds) => {
    if (rowIds.length < 2) return;
    rowIds.forEach((rowId) => {
      result[rowId] = {
        ...result[rowId],
        trackingCode: "کد رهگیری تکراری است.",
      };
    });
  });

  return result;
}

export function buildImportPreviewRows(
  previewRows: ImportPreviewRow[],
  units: DraftUnit[],
  externalErrors: UnitRowErrors = {},
): ImportPreviewRow[] {
  const rowErrors = buildLocalUnitRowErrors(units);
  return previewRows.map((row) => {
    if (!row.unitRowId) {
      return { ...row, messages: ["ردیف خالی است."] };
    }
    const errors = {
      ...(rowErrors[row.unitRowId] || {}),
      ...(externalErrors[row.unitRowId] || {}),
    };
    const messages = [
      errors.productIdentifier,
      errors.serialNumber,
      errors.trackingCode,
    ].filter(Boolean) as string[];
    return { ...row, messages };
  });
}

export function hasUnitRowErrors(errors: UnitRowErrors): boolean {
  return Object.values(errors).some((rowErrors) =>
    Object.values(rowErrors).some(Boolean),
  );
}

export function countImportRows(
  rows: ImportPreviewRow[],
  type: "valid" | "serial" | "tracking" | "empty",
): number {
  return rows.filter((row) => {
    if (type === "valid") return row.unitRowId && row.messages.length === 0;
    if (type === "empty") return !row.unitRowId;
    if (type === "serial") {
      return row.messages.some((message) => message.includes("سریال"));
    }
    return row.messages.some((message) => message.includes("رهگیری"));
  }).length;
}

export function extractDuplicateDetails(
  details: unknown,
): DuplicateWarehouseUnitDetail[] {
  if (!details || typeof details !== "object") return [];
  const duplicates = (details as { duplicates?: unknown }).duplicates;
  if (!Array.isArray(duplicates)) return [];
  return duplicates.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const field: DuplicateWarehouseUnitDetail["field"] | null =
      record.field === "serialNumber" || record.field === "trackingCode"
        ? record.field
        : null;
    const inputRowIndex = Number(record.inputRowIndex);
    if (!field || !Number.isInteger(inputRowIndex)) return [];
    return [
      {
        field,
        value: String(record.value ?? ""),
        inputRowIndex,
        existingUnitId: toNullableString(record.existingUnitId),
        existingProductName: toNullableString(record.existingProductName),
        existingStockTitle: toNullableString(record.existingStockTitle),
        existingReceiptCode: toNullableString(record.existingReceiptCode),
        existingCreatedAt: toNullableString(record.existingCreatedAt),
      },
    ];
  });
}

export function buildDuplicateRowErrors(
  duplicates: DuplicateWarehouseUnitDetail[],
  units: DraftUnit[],
): UnitRowErrors {
  return duplicates.reduce<UnitRowErrors>((result, duplicate) => {
    const row = units[duplicate.inputRowIndex];
    if (!row) return result;
    result[row.rowId] = {
      ...result[row.rowId],
      [duplicate.field]: duplicateMessage(duplicate),
    };
    return result;
  }, {});
}

async function parseXlsxRows(buffer: ArrayBuffer): Promise<ImportSourceRow[]> {
  const entries = await readZipEntries(buffer);
  const sheetPath = getFirstWorksheetPath(entries);
  const sheetXml = await readZipText(entries, sheetPath);
  const sharedStrings = entries.has("xl/sharedStrings.xml")
    ? parseSharedStrings(await readZipText(entries, "xl/sharedStrings.xml"))
    : [];
  const document = parseXml(sheetXml);
  const rows = Array.from(document.getElementsByTagName("row")).map((row) => {
    const excelRowNumber = Number(row.getAttribute("r")) || 0;
    const cells = new Map<string, string>();
    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      const ref = cell.getAttribute("r") || "";
      const column = ref.replace(/[0-9]/g, "");
      if (!["A", "B", "C"].includes(column)) return;
      cells.set(column, readCellValue(cell, sharedStrings));
    });

    return {
      excelRowNumber,
      values: [cells.get("A") || "", cells.get("B") || "", cells.get("C") || ""],
    };
  });

  return parseGridRows(
    rows.map((row, index) => ({
      rowNumber: row.excelRowNumber || index + 1,
      values: row.values,
    })),
    1,
  );
}

function parseGridRows(
  rows: Array<{ rowNumber: number; values: string[] }>,
  fallbackStartRow: number,
): ImportSourceRow[] {
  const normalizedRows = rows.map((row, index) => ({
    excelRowNumber: row.rowNumber || fallbackStartRow + index,
    productIdentifier: normalizeDigits((row.values[0] || "").trim()),
    serialNumber: normalizeDigits((row.values[1] || "").trim()),
    trackingCode: normalizeDigits((row.values[2] || "").trim()),
  }));
  const firstContentIndex = normalizedRows.findIndex(
    (row) => !isEmptyImportRow(row),
  );
  if (
    firstContentIndex >= 0 &&
    isImportHeaderRow(normalizedRows[firstContentIndex])
  ) {
    return normalizedRows.filter((_, index) => index !== firstContentIndex);
  }
  return normalizedRows;
}

function parseDelimitedText(
  text: string,
  fileName: string,
): Array<{ rowNumber: number; values: string[] }> {
  const delimiter = fileName.endsWith(".tsv") ? "\t" : detectDelimiter(text);
  const rows: Array<{ rowNumber: number; values: string[] }> = [];
  let current = "";
  let row: string[] = [];
  let isQuoted = false;
  let rowNumber = 1;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === "\"") {
      if (isQuoted && nextChar === "\"") {
        current += "\"";
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (char === delimiter && !isQuoted) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(current);
      rows.push({ rowNumber, values: row });
      rowNumber += 1;
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push({ rowNumber, values: row });
  return rows;
}

function detectDelimiter(text: string): "," | ";" | "\t" {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const counts = [
    { delimiter: "," as const, count: firstLine.split(",").length },
    { delimiter: ";" as const, count: firstLine.split(";").length },
    { delimiter: "\t" as const, count: firstLine.split("\t").length },
  ];
  return counts.sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
}

function parseSharedStrings(xml: string): string[] {
  const document = parseXml(xml);
  return Array.from(document.getElementsByTagName("si")).map((item) =>
    Array.from(item.getElementsByTagName("t"))
      .map((node) => node.textContent || "")
      .join(""),
  );
}

function readCellValue(cell: Element, sharedStrings: string[]): string {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") {
    return Array.from(cell.getElementsByTagName("t"))
      .map((node) => node.textContent || "")
      .join("");
  }

  const value = cell.getElementsByTagName("v")[0]?.textContent || "";
  if (type === "s") return sharedStrings[Number(value)] || "";
  return value;
}

function parseXml(xml: string): Document {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.getElementsByTagName("parsererror").length) {
    throw new Error("ساختار فایل اکسل قابل خواندن نیست.");
  }
  return document;
}

function getFirstWorksheetPath(entries: Map<string, Uint8Array>): string {
  if (!entries.has("xl/workbook.xml")) {
    if (entries.has("xl/worksheets/sheet1.xml")) return "xl/worksheets/sheet1.xml";
    throw new Error("شیت اکسل پیدا نشد.");
  }

  const workbookXmlEntry = entries.get("xl/workbook.xml");
  const relsXmlEntry = entries.get("xl/_rels/workbook.xml.rels");
  if (!workbookXmlEntry || !relsXmlEntry) return "xl/worksheets/sheet1.xml";

  const workbook = parseXml(decodeUtf8(workbookXmlEntry));
  const firstSheet = workbook.getElementsByTagName("sheet")[0];
  const relationId = firstSheet?.getAttribute("r:id");
  if (!relationId) return "xl/worksheets/sheet1.xml";

  const rels = parseXml(decodeUtf8(relsXmlEntry));
  const relation = Array.from(rels.getElementsByTagName("Relationship")).find(
    (item) => item.getAttribute("Id") === relationId,
  );
  const target = relation?.getAttribute("Target");
  if (!target) return "xl/worksheets/sheet1.xml";
  return normalizeZipPath(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
}

async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const data = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const entries = new Map<string, Uint8Array>();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("ساختار فایل اکسل قابل خواندن نیست.");
    }
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileName = decodeUtf8(data.slice(offset + 46, offset + 46 + fileNameLength));
    const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = data.slice(dataStart, dataStart + compressedSize);
    entries.set(
      normalizeZipPath(fileName),
      compressionMethod === 0
        ? compressed
        : await inflateZipEntry(compressed, compressionMethod),
    );
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(view: DataView): number {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error("فایل اکسل معتبر نیست.");
}

async function inflateZipEntry(
  data: Uint8Array,
  compressionMethod: number,
): Promise<Uint8Array> {
  if (compressionMethod !== 8) {
    throw new Error("نوع فشرده‌سازی فایل اکسل پشتیبانی نمی‌شود.");
  }
  const streamConstructor = (
    globalThis as unknown as {
      DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array>;
    }
  ).DecompressionStream;
  if (!streamConstructor) {
    throw new Error("مرورگر امکان خواندن فایل xlsx را پشتیبانی نمی‌کند.");
  }

  const stream = new Blob([data.slice()])
    .stream()
    .pipeThrough(new streamConstructor("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipText(
  entries: Map<string, Uint8Array>,
  path: string,
): Promise<string> {
  const entry = entries.get(normalizeZipPath(path));
  if (!entry) throw new Error("شیت اکسل پیدا نشد.");
  return decodeUtf8(entry);
}

function decodeUtf8(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

function normalizeZipPath(path: string): string {
  const parts: string[] = [];
  path.replace(/\\/g, "/").split("/").forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") {
      parts.pop();
      return;
    }
    parts.push(part);
  });
  return parts.join("/");
}

function isImportHeaderRow(row: ImportSourceRow): boolean {
  return [
    normalizeHeader(row.productIdentifier),
    normalizeHeader(row.serialNumber),
    normalizeHeader(row.trackingCode),
  ].some((value) =>
    [
      "شناسه محصول",
      "شناسه کالا",
      "productidentifier",
      "serialnumber",
      "trackingcode",
      "سریال محصول",
      "سریال کالا",
      "کد رهگیری",
    ]
      .map(normalizeHeader)
      .includes(value),
  );
}

function normalizeHeader(value: string): string {
  return value.replace(/[\s_\-/]/g, "").toLowerCase();
}

function duplicateMessage(duplicate: DuplicateWarehouseUnitDetail): string {
  const fieldLabel =
    duplicate.field === "serialNumber" ? "این سریال" : "این کد رهگیری";
  const productName = duplicate.existingProductName || "کالا";
  const duplicateValue = duplicate.value ? ` (${formatFaDigits(duplicate.value)})` : "";
  const receiptCode = duplicate.existingReceiptCode
    ? formatFaDigits(duplicate.existingReceiptCode)
    : "-";
  const stockTitle = duplicate.existingStockTitle
    ? ` در ${duplicate.existingStockTitle}`
    : "";
  const rowInfo =
    Number.isInteger(duplicate.inputRowIndex) && duplicate.inputRowIndex >= 0
      ? ` ردیف ${formatFaDigits(String(duplicate.inputRowIndex + 1))}`
      : "";
  return `${fieldLabel}${duplicateValue} قبلاً برای ${productName}${stockTitle} در رسید ${receiptCode}${rowInfo} ثبت شده است.`;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text ? text : null;
}
