// in2min2.com/e/{code}: the short link (easy to read aloud) → the full address.

import { notFound, redirect } from "next/navigation";
import { resolveShortCode } from "@/lib/public-event";

export default async function ShortLink({ params, searchParams }: PageProps<"/e/[code]">) {
  const { code } = await params;
  const target = await resolveShortCode(code);
  if (!target) notFound();
  const g = (await searchParams).g;
  redirect(`/${target.type}/${target.slug}${typeof g === "string" ? `?g=${encodeURIComponent(g)}` : ""}`);
}
