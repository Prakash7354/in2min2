"use client";

// Everything a Builder 2.0 screen or panel needs, from one place (app.tsx):
// the host's event (the same draft as the classic builder), saving, sign-in,
// the AI writer, publishing, replies and photos, and where they are.

import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Adjustment, CopyKey } from "@/lib/ai/copy";
import type { Draft } from "@/lib/draft";
import type { PhotosState } from "../builder/photos";
import type { RepliesState } from "../builder/replies";
import type { Nav, Panel, SheetKey } from "./nav";

// `at`: which box the error belongs to ("all": the whole write), so it shows beside it.
export type AiState = { busy: CopyKey | "all" | null; error: string | null; at?: CopyKey | "all"; trimmed: boolean; done: boolean };
export type PubState = { busy: boolean; error: string | null; note: string | null; done: boolean };

export type B2 = {
  d: Draft;
  update: (fn: (d: Draft) => Draft) => void;
  now: number;
  saved: boolean;
  session: Session | null;
  say: (message: string) => void;
  nav: Nav;
  go: (patch: Partial<Omit<Nav, "n">>) => void;
  back: () => Promise<void>;
  open: (panel: Panel) => void;
  openSheet: (sheet: SheetKey) => void;
  askSignIn: (why: string, then?: () => void) => void;
  ai: AiState;
  writeAll: () => Promise<void>;
  writeOne: (key: CopyKey, adjust: Adjustment) => Promise<void>;
  pub: PubState;
  publish: () => Promise<void>;
  replies: RepliesState;
  photos: PhotosState;
  startAgain: () => void;
};

export const B2Context = createContext<B2 | null>(null);

export function useB2(): B2 {
  const v = useContext(B2Context);
  if (!v) throw new Error("useB2 outside Builder 2.0");
  return v;
}

// Where each thing still needed for publishing is filled in.
export const MISSING_PANEL: Record<number, Panel> = { 0: "settings", 1: "people", 2: "details", 3: "words", 6: "publish" };
