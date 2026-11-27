// Shows a help article's blocks (lib/help.ts): paragraphs, steps, lists,
// tips, warnings and tables. Words may hold **bold** and [label](/link).

import type { ReactNode } from "react";
import Link from "next/link";
import type { Block } from "@/lib/help";

const MARK = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = text.split(MARK).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!m) return part;
    return m[2].startsWith("/") ? <Link key={i} href={m[2]}>{m[1]}</Link> : <a key={i} href={m[2]}>{m[1]}</a>;
  });
  return <>{out}</>;
}

export function HelpBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="s-hbody">
      {blocks.map((b, i) => {
        if ("p" in b) return <p key={i}><Inline text={b.p} /></p>;
        if ("h" in b) return <h2 key={i}><Inline text={b.h} /></h2>;
        if ("steps" in b) return <ol key={i} className="s-hsteps">{b.steps.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ol>;
        if ("list" in b) return <ul key={i} className="s-hlist">{b.list.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
        if ("tip" in b) return <p key={i} className="s-hnote s-htip"><b>Tip</b><span><Inline text={b.tip} /></span></p>;
        if ("warn" in b) return <p key={i} className="s-hnote s-hwarn"><b>Please note</b><span><Inline text={b.warn} /></span></p>;
        return (
          <div key={i} className="s-htable" role="region" tabIndex={0} aria-label="Table">
            <table>
              <thead><tr>{b.table[0].map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>{b.table.slice(1).map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
