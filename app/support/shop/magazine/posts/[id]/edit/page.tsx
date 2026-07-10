import { redirect } from "next/navigation";

export default async function SupportMagazineEditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/support/shop/magazine/${id}/edit`);
}
