import Link from "next/link";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { NajaCenterStatusBadge } from "@/components/naja/naja-center-status-badge";
import type { NajaCenter } from "@/lib/models/naja-center.model";

interface NajaCentersTableProps {
  centers: NajaCenter[];
  actionBasePath?: string;
  readOnly?: boolean;
}

export function NajaCentersTable({
  centers,
  actionBasePath = "/naja/centers",
  readOnly = false,
}: NajaCentersTableProps) {
  const columns: DataTableColumn<NajaCenter>[] = [
    {
      key: "name",
      header: "نام مرکز",
      render: (row) => (
        <span className="font-semibold text-[#1F3A5F]">{row.name}</span>
      ),
    },
    { key: "centerCode", header: "کد مرکز", render: (row) => row.centerCode },
    { key: "responsibleName", header: "مسئول", render: (row) => row.responsibleName },
    { key: "phone", header: "تلفن", render: (row) => row.phone },
    { key: "province", header: "استان", render: (row) => row.province },
    { key: "city", header: "شهر", render: (row) => row.city },
    { key: "county", header: "شهرستان", render: (row) => row.county },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <NajaCenterStatusBadge status={row.status} />,
    },
  ];

  if (!readOnly) {
    columns.push({
      key: "actions",
      header: "عملیات",
      sticky: "left",
      headerClassName: "min-w-[150px]",
      cellClassName: "min-w-[150px]",
      render: (row) => (
        <Link
          href={`${actionBasePath}/${row.objectId}/edit`}
          className="rounded-xl border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#334155]"
        >
          مشاهده / ویرایش
        </Link>
      ),
    });
  }

  return <DataTable columns={columns} rows={centers} rowKey={(row) => row.objectId} />;
}
