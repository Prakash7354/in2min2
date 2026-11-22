import type { Metadata, Viewport } from "next";
import ErrorReporter from "@/components/error-reporter";
import { fontVariables } from "./fonts";
import "./globals.css";
import "@/components/event/event-view.css";
import { DEFAULT_OPEN_GRAPH } from "@/lib/site-share";

export const metadata: Metadata = {
  metadataBase: new URL("https://in2min2.com"),
  title: "In2Min2",
  description: "Your event online in two minutes, from invitation to memory book, on one link.",
  // The sharing picture for pages that don't set their own (lib/site-share.ts).
  openGraph: DEFAULT_OPEN_GRAPH,
  // Proves to Bing Webmaster Tools that in2min2.com is the owner's (22 Nov
  // 2026). Bing checks it again from time to time: never remove it. A public
  // code, not a secret. (Google is proved by a DNS record in Cloudflare.)
  verification: { other: { "msvalidate.01": "C754E3FA87842FE699B9A6F6ABEC38FD" } },
};

export const viewport: Viewport = {
  themeColor: "#FFF9EF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}<ErrorReporter /></body>
    </html>
  );
}
