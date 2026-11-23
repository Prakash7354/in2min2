// in2min2.com/new/style: the Design 2.0 style page (CONCEPT 7e). For us, not
// for search engines.
import type { Metadata } from "next";
import { StyleGuide } from "../loader";

export const metadata: Metadata = { title: "in2min2 · Style", robots: { index: false, follow: false } };

export default function NewStylePage() {
  return <StyleGuide />;
}
