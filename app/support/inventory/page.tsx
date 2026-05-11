"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  InventoryUpdateModal,
  type InventoryUpdateFormInput,
} from "@/components/support/inventory-update-modal";
import { ProductStatusBadge } from "@/components/support/product-status-badge";
import { Button } from "@/components/ui/button";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { getErrorMessage } from "@/lib/api/api-error";
import type { Product } from "@/lib/models/product.model";
import {
  listProducts,
  updateProductStock,
} from "@/lib/services/product.service";
import {
  compareText,
  formatNumber,
} from "@/lib/expert/utils";

export default function SupportInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalChangeType, setModalChangeType] = useState<
    "increase" | "decrease"
  >("increase");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setMessage("");

      try {
        const data = await listProducts();
        if (isMounted) setProducts(data);
      } catch (error) {
        if (isMounted) {
          setMessageType("error");
          setMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const openModal = (product: Product, changeType: "increase" | "decrease") => {
    setSelectedProduct(product);
    setModalChangeType(changeType);
    setModalOpen(true);
  };

  const rows = useMemo(
    () => [...products].sort((a, b) => compareText(a.name, b.name)),
    [products],
  );

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "کالا", render: (row) => row.name },
    {
      key: "total",
      header: "موجودی کل",
      render: (row) => formatNumber(row.totalStock),
    },
    {
      key: "reserved",
      header: "موجودی رزروشده",
      render: (row) => formatNumber(row.reservedStock),
    },
    {
      key: "available",
      header: "موجودی قابل استفاده",
      render: (row) => formatNumber(row.availableStock),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row) => <ProductStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "عملیات",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => openModal(row, "increase")}
          >
            افزایش موجودی
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => openModal(row, "decrease")}
          >
            کاهش موجودی
          </Button>
        </div>
      ),
    },
  ];

  const submitInventory = async (input: InventoryUpdateFormInput) => {
    if (!selectedProduct) return;

    try {
      const updated = await updateProductStock(selectedProduct.objectId, {
        inventoryScope: input.inventoryScope,
        changeType: input.changeType,
        amount: input.amount,
        notes: input.note.trim() || undefined,
      });
      setProducts((current) =>
        current.map((product) =>
          product.objectId === updated.objectId ? updated : product,
        ),
      );
      setMessageType("success");
      setMessage("تغییر موجودی ثبت شد.");
      setModalOpen(false);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <DashboardLayout role="support" title="به روزرسانی موجودی">
      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}
      {isLoading ? (
        <LoadingState
          title="در حال دریافت کالاها"
          description="اطلاعات موجودی از سرور دریافت می شود."
        />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="کالایی یافت نشد"
          description="هنوز کالایی برای به روزرسانی موجودی ثبت نشده است."
        />
      )}

      <InventoryUpdateModal
        open={modalOpen}
        product={selectedProduct}
        initialChangeType={modalChangeType}
        onClose={() => setModalOpen(false)}
        onSubmit={submitInventory}
      />
    </DashboardLayout>
  );
}
