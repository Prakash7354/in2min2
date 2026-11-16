"use client";

// Each Home tile opens one panel: a full screen with Back at the top, a big
// heading, the choices, and one button at the bottom. Every change is saved
// as it's made, so "Done" just goes back.

import type { ReactNode } from "react";
import type { IconName } from "@/components/icons";
import { useB2 } from "./context";
import type { Panel } from "./nav";
import { DetailsPanel } from "./panels/details";
import { LookPanel } from "./panels/look";
import { PeoplePanel } from "./panels/people";
import { PhotosPanel } from "./panels/photos";
import { PlanPanel } from "./panels/plan";
import { PreviewPanel } from "./panels/preview";
import { PublishPanel } from "./panels/publish";
import { RepliesPanel } from "./panels/replies";
import { SettingsPanel } from "./panels/settings";
import { WordsPanel } from "./panels/words";
import { Peek } from "./peek";
import { BottomBar, PanelHead, TopBar } from "./ui";

export function PanelView({ panel }: { panel: Panel }) {
  switch (panel) {
    case "words": return <WordsPanel />;
    case "details": return <DetailsPanel />;
    case "people": return <PeoplePanel />;
    case "plan": return <PlanPanel />;
    case "look": return <LookPanel />;
    case "settings": return <SettingsPanel />;
    case "publish": return <PublishPanel />;
    case "preview": return <PreviewPanel />;
    case "replies": return <RepliesPanel />;
    case "photos": return <PhotosPanel />;
  }
}

// `peek`: the live little card beside Done, for panels that change what guests see.
export function PanelShell({ icon, title, line, children, footer, wide, peek }: {
  icon: IconName; title: string; line?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean; peek?: boolean;
}) {
  const b = useB2();
  return (
    <>
      <TopBar title={b.d.title || undefined} onBack={() => void b.back()} right={<span />} />
      <main className="b2-screen" data-wide={wide ? "" : undefined}>
        <PanelHead icon={icon} title={title} line={line} />
        {children}
      </main>
      <BottomBar aside={peek ? <Peek /> : undefined}>
        {footer ?? <button type="button" className="b2-btn b2-primary b2-block" onClick={() => void b.back()}>Done</button>}
      </BottomBar>
    </>
  );
}
