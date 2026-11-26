import type { Metadata } from "next";

// The owner's admin: never shown by search engines.
export const metadata: Metadata = {
  title: "Admin · in2min2",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
