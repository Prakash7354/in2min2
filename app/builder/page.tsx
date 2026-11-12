import type { Metadata } from "next";
import Link from "next/link";
import CopyWriter from "./copy-writer";

export const metadata: Metadata = {
  title: "AI writer · In2Min2",
  description: "Give four facts and let the AI write your invitation, event page and thank-you message.",
};

export default function BuilderPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-neutral-500 hover:text-rose-600">
        ← In2Min2
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Write my event text</h1>
      <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">
        Fill in the facts, press Generate, then edit anything you like. Nothing is saved yet. This is a preview of
        the builder.
      </p>
      <div className="mt-8">
        <CopyWriter />
      </div>
    </main>
  );
}
