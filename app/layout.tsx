import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";
import "@/components/event/event-view.css";

export const metadata: Metadata = {
  title: "In2Min2",
  description: "Your event online in two minutes, from invitation to memory book, on one link.",
};

export const viewport: Viewport = {
  themeColor: "#FFF9EF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
