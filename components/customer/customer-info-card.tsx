import { Card } from "@/components/ui/card";
import type { Order } from "@/lib/models/order.model";
import { formatDeliveryAddress } from "@/lib/utils/address-format";
import { formatFaDigits } from "@/lib/utils/number-format";

interface CustomerInfoCardProps {
  order: Pick<
    Order,
    | "customerName"
    | "customerPhone"
    | "customerNationalId"
    | "deliveryAddressTitle"
    | "deliveryProvince"
    | "deliveryCity"
    | "deliveryCounty"
    | "deliveryFullAddress"
    | "deliveryPostalCode"
    | "deliveryPlaque"
    | "deliveryUnit"
    | "receiverFullName"
    | "receiverPhone"
  >;
}

export function CustomerInfoCard({ order }: CustomerInfoCardProps) {
  const hasCustomerData = Boolean(
    order.customerName ||
      order.customerPhone ||
      order.customerNationalId ||
      order.deliveryFullAddress ||
      order.receiverFullName ||
      order.receiverPhone,
  );

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold text-[#1F3A5F]">
        اطلاعات مشتری و تحویل
      </h3>
      {!hasCustomerData ? (
        <p className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 text-sm text-[#6B7280]">
          اطلاعات مشتری ثبت نشده است.
        </p>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoItem label="نام مشتری" value={order.customerName || "-"} />
          <InfoItem label="شماره موبایل" value={order.customerPhone ? formatFaDigits(order.customerPhone) : "-"} />
          {order.customerNationalId ? (
            <InfoItem label="کد ملی" value={formatFaDigits(order.customerNationalId)} />
          ) : null}
          <InfoItem
            label="آدرس تحویل"
            value={formatDeliveryAddress(order)}
            className="sm:col-span-2"
          />
          <InfoItem label="گیرنده بار" value={order.receiverFullName || "-"} />
          <InfoItem label="موبایل گیرنده" value={order.receiverPhone ? formatFaDigits(order.receiverPhone) : "-"} />
        </dl>
      )}
    </Card>
  );
}

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#E5E7EB] bg-[#FBFCFD] p-3 ${className}`}>
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 whitespace-normal text-sm font-medium leading-7 text-[#1F3A5F]">
        {value}
      </dd>
    </div>
  );
}
