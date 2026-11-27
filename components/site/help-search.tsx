"use client";

// The help library's list and search box (in2min2.com/help). Typing narrows
// the articles by words in the title, the short line and the search words.
// The full list is in the page for search engines; this only hides what
// doesn't match.

import { useState } from "react";
import Link from "next/link";

export type HelpEntry = { slug: string; group: string; title: string; summary: string; text: string };
export type HelpGroup = { key: string; title: string; line: string };

export function HelpSearch({ groups, entries }: { groups: HelpGroup[]; entries: HelpEntry[] }) {
  const [q, setQ] = useState("");
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hit = (e: HelpEntry) => words.every((w) => e.text.includes(w));
  const shown = entries.filter(hit);
  return (
    <>
      <form className="s-hsearch" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="help-q" className="s-sr">Search the help library</label>
        <input id="help-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, for example “photos” or “WhatsApp”"
          autoComplete="off" enterKeyHint="search" />
      </form>
      {q && <p className="s-hcount" role="status">{shown.length ? `${shown.length} ${shown.length === 1 ? "answer" : "answers"} found` : "Nothing found. Try another word, or contact us."}</p>}
      <div className="s-hgroups">
        {groups.map((g) => {
          const list = shown.filter((e) => e.group === g.key);
          if (!list.length) return null;
          return (
            <section key={g.key} className="s-hgroup" aria-labelledby={`hg-${g.key}`}>
              <h2 id={`hg-${g.key}`}>{g.title}</h2>
              <p>{g.line}</p>
              <ul>
                {list.map((e) => <li key={e.slug}><Link href={`/help/${e.slug}`}><b>{e.title}</b><span>{e.summary}</span></Link></li>)}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
