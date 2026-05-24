"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  InventoryUpdateModal,
  type InventoryUpdateFormInput,
} from "@/components/support/inventory-update-modal";
import { ProductStatusBadge } from "@/components/support/product-status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { InlineErrorMessage } from "@/components/shared/inline-error-message";
import { LoadingState } from "@/components/shared/loading-state";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/api-error";
import { compareText, formatNumber } from "@/lib/expert/utils";
import type { Product } from "@/lib/models/product.model";
import {
  listProducts,
  updateProductNajaStock,
} from "@/lib/services/product.service";

export default function SupportNajaInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalChangeType, setModalChangeType] = useState<
    "increase" | "decrease"
  >("increase");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setMessage("");

      try {
        const data = await listProducts("support");
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

  const rows = useMemo(
    () => [...products].sort((a, b) => compareText(a.name, b.name)),
    [products],
  );

  const openModal = (product: Product, changeType: "increase" | "decrease") => {
    setSelectedProduct(product);
    setModalChangeType(changeType);
    setModalOpen(true);
  };

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "کالا", render: (row) => row.name },
    { key: "brand", header: "برند", render: (row) => row.brand },
    {
      key: "sku",
      header: "شناسه کالا",
      render: (row) => row.id || row.sku || "-",
    },
    {
      key: "naja",
      header: "موجودی ناجا",
      render: (row) => formatNumber(row.najaInventoryQty),
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => openModal(row, "increase")}
        >
          مدیریت موجودی
        </Button>
      ),
    },
  ];

  const submitInventory = async (input: InventoryUpdateFormInput) => {
    if (!selectedProduct) return;

    try {
      const updated = await updateProductNajaStock(selectedProduct.objectId, {
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
      setMessage("تغییر موجودی ناجا ثبت شد.");
      setModalOpen(false);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <DashboardLayout role="support" title="موجودی ناجا">
      <SectionHeader
        title="فهرست موجودی ناجا"
        description="مدیریت موجودی اختصاصی سفارش‌های ناجا"
      />

      {message && messageType === "success" ? (
        <div className="asama-banner px-4 py-3 text-sm">{message}</div>
      ) : null}
      {message && messageType === "error" ? (
        <InlineErrorMessage message={message} />
      ) : null}

      {isLoading ? (
        <LoadingState title="در حال دریافت موجودی ناجا" />
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.objectId || row.id}
        />
      ) : (
        <EmptyState
          title="کالایی یافت نشد"
          description="هنوز کالایی برای موجودی ناجا ثبت نشده است."
        />
      )}

      <InventoryUpdateModal
        open={modalOpen}
        product={selectedProduct}
        inventoryScope="naja"
        initialChangeType={modalChangeType}
        onClose={() => setModalOpen(false)}
        onSubmit={submitInventory}
      />
    </DashboardLayout>
  );
}
