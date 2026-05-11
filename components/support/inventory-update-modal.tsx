"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { toNumber } from "@/lib/utils/number-format";

interface InventoryProduct {
  objectId?: string;
  id: string;
  name: string;
}

export interface InventoryUpdateFormInput {
  productId: string;
  inventoryScope?: "normal" | "naja";
  changeType: "increase" | "decrease";
  amount: number;
  note: string;
  createdBy: string;
}

interface InventoryUpdateModalProps {
  open: boolean;
  product: InventoryProduct | null;
  initialChangeType?: "increase" | "decrease";
  inventoryScope?: "normal" | "naja";
  onClose: () => void;
  onSubmit: (input: InventoryUpdateFormInput) => void;
}

export function InventoryUpdateModal({
  open,
  product,
  initialChangeType = "increase",
  inventoryScope = "normal",
  onClose,
  onSubmit,
}: InventoryUpdateModalProps) {
  if (!open || !product) return null;

  return (
    <InventoryUpdateModalContent
      key={`${product.id}-${initialChangeType}`}
      initialChangeType={initialChangeType}
      inventoryScope={inventoryScope}
      onClose={onClose}
      onSubmit={onSubmit}
      product={product}
      open={open}
    />
  );
}

function InventoryUpdateModalContent({
  open,
  product,
  initialChangeType = "increase",
  inventoryScope = "normal",
  onClose,
  onSubmit,
}: InventoryUpdateModalProps & { product: InventoryProduct; open: boolean }) {
  const [changeType, setChangeType] = useState<"increase" | "decrease">(
    initialChangeType,
  );
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-[34rem]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              productId: product.id,
              inventoryScope,
              changeType,
              amount: toNumber(amount),
              note,
              createdBy: "سارا کریمی",
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {inventoryScope === "naja" ? "به روزرسانی موجودی ناجا" : "به روزرسانی موجودی"}
            </DialogTitle>
            <DialogDescription>{product.name}</DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>نوع تغییر</span>
              <SearchableSelect
                value={changeType}
                onValueChange={(value) =>
                  setChangeType(value as "increase" | "decrease")
                }
                options={[
                  { value: "increase", label: "افزایش موجودی" },
                  { value: "decrease", label: "کاهش موجودی" },
                ]}
                placeholder="نوع تغییر"
                searchPlaceholder="جستجو در نوع تغییر"
                emptyMessage="موردی پیدا نشد"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>مقدار</span>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-[#334155]">
              <span>توضیحات</span>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-24"
              />
            </label>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit">ثبت تغییر</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
