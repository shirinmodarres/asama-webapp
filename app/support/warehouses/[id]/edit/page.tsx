import { redirect } from "next/navigation";

export default async function DeprecatedEditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/support/warehouses/${id}`);
}
