import { eventFontVariables } from "@/components/event/fonts";

// The builder draws real event pages, so it carries every event font
// (downloaded only when a style actually uses one).
export default function BuilderLayout({ children }: LayoutProps<"/builder">) {
  return <div className={`${eventFontVariables} flex min-h-full flex-1 flex-col`}>{children}</div>;
}
