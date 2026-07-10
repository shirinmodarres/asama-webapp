import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  sticky?: "left" | "right";
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full text-right">
          <thead className="border-b border-[#E9EEF3] bg-[#F8FBFD]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "sticky top-0 z-30 whitespace-nowrap bg-[#F8FBFD] px-5 py-4 text-xs font-semibold tracking-wide text-[#5B6B7F]",
                    column.className,
                    column.headerClassName,
                    column.sticky === "left" &&
                      "left-0 z-40 shadow-[-10px_0_20px_rgba(15,23,42,0.04)]",
                    column.sticky === "right" &&
                      "right-0 z-40 shadow-[10px_0_20px_rgba(15,23,42,0.04)]",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {rows.map((row, index) => (
              <tr
                key={`${rowKey(row) ?? "row"}-${index}`}
                className={cn(
                  "transition-colors hover:bg-[#F8FBFD]",
                  index % 2 === 1 && "bg-[#FCFDFE]",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "whitespace-nowrap px-5 py-4 align-middle text-sm text-[#334155]",
                      column.className,
                      column.cellClassName,
                      column.sticky === "left" &&
                        "sticky left-0 z-10 bg-inherit shadow-[-10px_0_20px_rgba(15,23,42,0.03)]",
                      column.sticky === "right" &&
                        "sticky right-0 z-10 bg-inherit shadow-[10px_0_20px_rgba(15,23,42,0.03)]",
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
