import { PdfPage } from "@/components/pdf/pdf-shell";
import { formatNumber } from "@/lib/expert/utils";
import { formatFaDigits } from "@/lib/utils/number-format";

export interface SlipInfoField {
  label: string;
  value: string;
  className?: string;
}

export interface SlipInfoSection {
  title: string;
  fields: SlipInfoField[];
}

export interface SlipSummaryRow {
  key: string;
  productName: string;
  quantity: number;
}

export interface SlipDetailRow {
  key: string;
  productName: string;
  productSku: string;
  productIdentifier: string;
  serialNumber: string;
  trackingCode: string;
}

interface ExitSlipPdfDocumentProps {
  title: string;
  headerFields: SlipInfoField[];
  informationSections: SlipInfoSection[];
  summaryRows: SlipSummaryRow[];
  detailRows: SlipDetailRow[];
  noteFields?: SlipInfoField[];
  signatureLabels: [string, string];
}

const SUMMARY_ROWS_FIRST_PAGE = 16;
const SUMMARY_ROWS_NEXT_PAGE = 22;
const DETAIL_ROWS_FIRST_PAGE = 16;
const DETAIL_ROWS_NEXT_PAGE = 22;

export function ExitSlipPdfDocument({
  title,
  headerFields,
  informationSections,
  summaryRows,
  detailRows,
  noteFields = [],
  signatureLabels,
}: ExitSlipPdfDocumentProps) {
  const summaryPages = paginateRows(
    summaryRows,
    SUMMARY_ROWS_FIRST_PAGE,
    SUMMARY_ROWS_NEXT_PAGE,
  );
  const detailPages = paginateRows(
    detailRows,
    DETAIL_ROWS_FIRST_PAGE,
    DETAIL_ROWS_NEXT_PAGE,
  );
  const hasDetailPages = detailPages.length > 0;
  const totalItemCount = summaryRows.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <div className="space-y-0">
      {summaryPages.map((rows, index) => (
        <PdfPage
          key={`summary-${index}`}
          pageBreakAfter={index < summaryPages.length - 1 || hasDetailPages}
        >
          <div className="space-y-3 text-[11px] leading-5.5">
            <SlipHeader fields={headerFields} />
            <SlipTitle title={title} />
            {index === 0 ? (
              <>
                {informationSections.map((section) => (
                  <InformationSection key={section.title} section={section} />
                ))}
                <SummaryMeta totalItemCount={totalItemCount} />
              </>
            ) : null}
            <SummaryTable
              rows={rows}
              startIndex={
                index === 0
                  ? 0
                  : SUMMARY_ROWS_FIRST_PAGE +
                    (index - 1) * SUMMARY_ROWS_NEXT_PAGE
              }
            />
            {index === summaryPages.length - 1 && !hasDetailPages ? (
              <DocumentFooter
                noteFields={noteFields}
                signatureLabels={signatureLabels}
              />
            ) : null}
          </div>
        </PdfPage>
      ))}

      {detailPages.map((rows, index) => (
        <PdfPage
          key={`detail-${index}`}
          pageBreakAfter={index < detailPages.length - 1}
        >
          <div className="space-y-3 text-[11px] leading-5.5">
            <SlipHeader fields={headerFields} />
            <SlipTitle title={title} />
            <DetailTable
              rows={rows}
              startIndex={
                index === 0
                  ? 0
                  : DETAIL_ROWS_FIRST_PAGE +
                    (index - 1) * DETAIL_ROWS_NEXT_PAGE
              }
            />
            {index === detailPages.length - 1 ? (
              <DocumentFooter
                noteFields={noteFields}
                signatureLabels={signatureLabels}
              />
            ) : null}
          </div>
        </PdfPage>
      ))}
    </div>
  );
}

function SlipHeader({ fields }: { fields: SlipInfoField[] }) {
  return (
    <header className="relative flex min-h-24 items-start justify-between">
      <div className="absolute left-0 top-[-12px] w-fit border-r-2 border-[#7BC68A] bg-white/95 px-2 py-0.5 text-[9px] leading-5 text-[#334155]">
        {fields.map((field) => (
          <InlineInfo key={field.label} {...field} />
        ))}
      </div>
    </header>
  );
}

function SlipTitle({ title }: { title: string }) {
  return (
    <div className="flex justify-center">
      <div className="bg-white/95 px-6 py-1">
        <h1 className="text-lg font-bold text-[#102034]">{title}</h1>
      </div>
    </div>
  );
}

function InformationSection({ section }: { section: SlipInfoSection }) {
  return (
    <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
      <h2 className="mb-1.5 border-b border-[#E2E8F0] pb-1 text-[10.5px] font-bold text-[#1F3A5F]">
        {section.title}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9.5px]">
        {section.fields.map((field) => (
          <InlineInfo key={field.label} {...field} />
        ))}
      </dl>
    </section>
  );
}

function SummaryTable({
  rows,
  startIndex,
}: {
  rows: SlipSummaryRow[];
  startIndex: number;
}) {
  return (
    <section className="print-section print-table-section rounded-md border border-[#94A3B8] bg-white/95">
      <h2 className="border-b border-[#94A3B8] px-3 py-1.5 text-[10.5px] font-bold text-[#1F3A5F]">
        خلاصه کالاها
      </h2>
      <table className="summary-table items-table w-full table-fixed border-collapse text-right text-[10px] leading-4">
        <thead>
          <tr className="bg-[#EDF3F7] text-[#1F3A5F]">
            <TableHeader className="w-10">ردیف</TableHeader>
            <TableHeader>نام کالا</TableHeader>
            <TableHeader className="w-16">تعداد</TableHeader>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="print-table-row border-t border-[#CBD5E1]">
              <TableCell>{formatNumber(startIndex + index + 1)}</TableCell>
              <TableCell>{row.productName || "-"}</TableCell>
              <TableCell>{formatNumber(row.quantity)}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DetailTable({
  rows,
  startIndex,
}: {
  rows: SlipDetailRow[];
  startIndex: number;
}) {
  return (
    <section className="print-section print-table-section rounded-md border border-[#94A3B8] bg-white/95">
      <h2 className="border-b border-[#94A3B8] px-3 py-1.5 text-[10.5px] font-bold text-[#1F3A5F]">
        جزئیات اقلام
      </h2>
      <table className="detail-table items-table w-full table-fixed border-collapse text-right text-[10px] leading-4">
        <thead>
          <tr className="bg-[#EDF3F7] text-[#1F3A5F]">
            <TableHeader className="w-10">ردیف</TableHeader>
            <TableHeader className="w-[28%]">نام کالا</TableHeader>
            <TableHeader className="w-[15%]">کد کالا</TableHeader>
            <TableHeader className="w-[20%]">سریال</TableHeader>
            <TableHeader className="w-[14%]">کد رهگیری</TableHeader>
            <TableHeader className="w-[13%]">شناسه</TableHeader>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="print-table-row border-t border-[#CBD5E1]">
              <TableCell>{formatNumber(startIndex + index + 1)}</TableCell>
              <TableCell>{row.productName || "-"}</TableCell>
              <TableCell>{row.productSku ? formatFaDigits(row.productSku) : "-"}</TableCell>
              <TableCell className="serial-cell whitespace-nowrap text-[9.5px]">
                {row.serialNumber ? formatFaDigits(row.serialNumber) : "-"}
              </TableCell>
              <TableCell className="tracking-cell whitespace-nowrap text-[9.5px]">
                {row.trackingCode ? formatFaDigits(row.trackingCode) : "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-[9.5px]">
                {row.productIdentifier ? formatFaDigits(row.productIdentifier) : "-"}
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SummaryMeta({ totalItemCount }: { totalItemCount: number }) {
  return (
    <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
      <div className="flex items-center justify-between gap-3 text-[9.5px]">
        <span className="font-medium text-[#64748B]">تعداد کل اقلام</span>
        <span className="font-semibold text-[#102034]">
          {formatNumber(totalItemCount)}
        </span>
      </div>
    </section>
  );
}

function DocumentFooter({
  noteFields,
  signatureLabels,
}: {
  noteFields: SlipInfoField[];
  signatureLabels: [string, string];
}) {
  return (
    <>
      {noteFields.length ? (
        <section className="print-section rounded-md border border-[#CBD5E1] bg-white/95 px-3 py-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
            {noteFields.map((field) => (
              <InlineInfo key={field.label} {...field} />
            ))}
          </dl>
        </section>
      ) : null}
      <footer className="grid grid-cols-2 gap-8 pt-7">
        <Signature label={signatureLabels[0]} />
        <Signature label={signatureLabels[1]} />
      </footer>
    </>
  );
}

function InlineInfo({ label, value, className = "" }: SlipInfoField) {
  return (
    <div className={`flex min-w-0 items-start gap-1 ${className}`}>
      <dt className="shrink-0 font-medium text-[#64748B]">{label}:</dt>
      <dd className="min-w-0 font-semibold text-[#102034]">{value}</dd>
    </div>
  );
}

function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`border-l border-[#CBD5E1] px-1 py-1 font-bold last:border-l-0 ${className}`}>
      {children}
    </th>
  );
}

function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`break-words whitespace-normal border-l border-[#E2E8F0] px-1 py-1 align-top last:border-l-0 ${className}`}>
      {children}
    </td>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="pt-6">
      <div className="border-t border-[#94A3B8] pt-1.5 text-center text-[9.5px] font-semibold">
        {label}
      </div>
    </div>
  );
}

function paginateRows<T>(rows: T[], firstPageSize: number, nextPageSize: number): T[][] {
  if (!rows.length) return [];
  if (firstPageSize <= 0 || nextPageSize <= 0) return [rows];
  const chunks: T[][] = [rows.slice(0, firstPageSize)];
  for (let index = firstPageSize; index < rows.length; index += nextPageSize) {
    chunks.push(rows.slice(index, index + nextPageSize));
  }
  return chunks;
}
