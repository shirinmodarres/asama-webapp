import Link from "next/link";
import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/models/customer.model";
import { formatFaDigits } from "@/lib/utils/number-format";

interface CustomerListProps {
  customers: Customer[];
  detailsHref: (customer: Customer) => string;
  assignedExpertName?: (customer: Customer) => string | null | undefined;
  renderSelection?: (customer: Customer) => ReactNode;
  renderActions?: (customer: Customer) => ReactNode;
}

export function CustomerList({ customers, detailsHref, assignedExpertName, renderSelection, renderActions }: CustomerListProps) {
  const columns: DataTableColumn<Customer>[] = [
    ...(renderSelection ? [{ key: "select", header: "انتخاب", className: "w-20", render: renderSelection } satisfies DataTableColumn<Customer>] : []),
    { key: "name", header: "نام مشتری", render: (row) => <span className="font-medium text-[#1F3A5F]">{row.fullName || "-"}</span> },
    { key: "code", header: "کد سپیدار", render: (row) => row.sepidarCustomerCode ? formatFaDigits(row.sepidarCustomerCode) : "-" },
    { key: "phone", header: "موبایل/تلفن", render: (row) => row.phone ? formatFaDigits(row.phone) : "-" },
    { key: "grouping", header: "گروه مشتری", render: (row) => row.grouping?.title || "-" },
    { key: "channel", header: "کانال", render: (row) => row.channel || "-" },
    { key: "sub-channel", header: "زیرکانال", render: (row) => row.subChannel || "-" },
    { key: "expert", header: "کارشناس", render: (row) => assignedExpertName?.(row) ? <Badge variant="brand" dot>{assignedExpertName(row)}</Badge> : <Badge variant="neutral">بدون کارشناس</Badge> },
    { key: "status", header: "وضعیت", render: (row) => <Badge variant={row.status === "active" ? "success" : "neutral"} dot>{row.status === "active" ? "فعال" : "غیرفعال"}</Badge> },
    { key: "details", header: "جزئیات", sticky: "left", render: (row) => <div className="flex items-center gap-2"><Button asChild type="button" size="sm" variant="outline"><Link href={detailsHref(row)}><Eye className="size-4" />جزئیات</Link></Button>{renderActions?.(row)}</div> },
  ];
  return <DataTable columns={columns} rows={customers} rowKey={(row) => row.objectId} />;
}
