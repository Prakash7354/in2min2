"use client";

// in2min2.com/admin: the owner's own control room (26 Nov 2026,
// docs/PLAN-admin-enquiries.md). Sign in with the normal email code; only an
// account listed in the `admins` table (0018) sees anything. Everyone else
// gets "Not available". The database enforces this, not just this page.
//
// Home: totals (admin_overview) and the enquiries from /contact, which can be
// replied to by email (the button opens the owner's own email app), marked
// replied, archived, marked as spam, noted privately or deleted.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { SignInDialog, useSession } from "@/app/builder/account";
import { Button, Notice, inputClass } from "@/app/builder/ui";
import { SECRET_NAMES, SERVICES, STATE_WORDS } from "@/lib/admin-services";

type Status = "new" | "replied" | "archived" | "spam";
type Enquiry = {
  id: string; source: string; created_at: string; name: string; email: string; phone: string | null;
  message: string; status: Status; replied_at: string | null; notes: string | null;
};
type Overview = {
  enquiries: { new: number; total: number; week: number };
  accounts: { total: number; hosts: number };
  events: { total: number; published: number; drafts: number; week: number; month: number };
  replies: { total: number; week: number; attending: number };
  photos: { total: number };
  ai: { week: number };
  by_plan: { key: string; n: number }[];
  by_type: { key: string; n: number }[];
  days: { day: string; events: number; enquiries: number }[];
};

const TABS: { key: Status; label: string }[] = [
  { key: "new", label: "New" }, { key: "replied", label: "Replied" }, { key: "archived", label: "Archived" }, { key: "spam", label: "Spam" },
];

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Admin() {
  const { session, ready } = useSession();
  const [signIn, setSignIn] = useState(false);
  const [checked, setChecked] = useState<{ uid: string; ok: boolean } | null>(null);
  const uid = session?.user.id;

  useEffect(() => {
    let live = true;
    if (!uid) return;
    supabase().rpc("is_admin").then(({ data }) => { if (live) setChecked({ uid, ok: data === true }); });
    return () => { live = false; };
  }, [uid]);
  // Not yet known (null) until the answer is for this very account.
  const admin = checked && checked.uid === uid ? checked.ok : null;

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl content-start gap-5 px-4 pb-24 pt-6 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-muted">in2min2</p>
          <h1 className="font-display text-3xl font-extrabold text-brand">Admin</h1>
        </div>
        {session && <Button kind="quiet" onClick={() => void supabase().auth.signOut()}>Sign out</Button>}
      </header>

      {!ready ? <p className="text-muted">Loading…</p>
        : !session ? (
          <div className="grid gap-3 rounded-3xl border border-line bg-card p-6">
            <p className="text-[17px]">This page is for the owner of in2min2. Sign in with your email to continue.</p>
            <Button kind="brand" onClick={() => setSignIn(true)} className="w-full sm:w-auto">Sign in</Button>
          </div>
        ) : admin === null ? <p className="text-muted">Checking…</p>
        : admin === false ? <Notice tone="warn">Not available. This account isn&apos;t an admin. If it should be, add it with the SQL line at the bottom of 0018_enquiries_and_admin.sql.</Notice>
        : <Dashboard />}

      {signIn && <SignInDialog why="The admin is for the owner of in2min2." onClose={() => setSignIn(false)} onDone={() => setSignIn(false)} />}
    </div>
  );
}

function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Status>("new");
  const [view, setView] = useState<"inbox" | "services">("inbox");

  const [again, setAgain] = useState(0);
  const load = useCallback(() => setAgain((n) => n + 1), []);
  // New enquiries appear by themselves: every 30 seconds while this page is
  // open and visible, and straight away when you come back to it.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") load(); };
    const every = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(every); document.removeEventListener("visibilitychange", tick); };
  }, [load]);
  useEffect(() => {
    let live = true;
    Promise.all([
      supabase().rpc("admin_overview"),
      supabase().from("enquiries").select("id, source, created_at, name, email, phone, message, status, replied_at, notes").order("created_at", { ascending: false }).limit(500),
    ]).then(([o, e]) => {
      if (!live) return;
      if (o.error || e.error) { setError("Couldn't load. Check your signal and try again."); return; }
      setError(null);
      setOverview(o.data as Overview);
      setRows(e.data as Enquiry[]);
    });
    return () => { live = false; };
  }, [again]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { new: 0, replied: 0, archived: 0, spam: 0 };
    rows?.forEach((r) => { c[r.status]++; });
    return c;
  }, [rows]);
  const shown = rows?.filter((r) => r.status === tab) ?? [];

  async function change(id: string, patch: Partial<Pick<Enquiry, "status" | "replied_at" | "notes">>) {
    const { error: e } = await supabase().from("enquiries").update(patch).eq("id", id);
    if (e) { setError("That didn't save. Please try again."); return; }
    setRows((rs) => rs?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? rs);
    void supabase().rpc("admin_overview").then(({ data }) => { if (data) setOverview(data as Overview); });
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this enquiry for good? This can't be undone.")) return;
    const { error: e } = await supabase().from("enquiries").delete().eq("id", id);
    if (e) { setError("That didn't delete. Please try again."); return; }
    setRows((rs) => rs?.filter((r) => r.id !== id) ?? rs);
  }

  return (
    <>
      {error && <Notice tone="warn">{error}</Notice>}
      <div role="tablist" aria-label="Admin sections" className="flex gap-2">
        {([["inbox", "Inbox and totals"], ["services", "Connected services"]] as const).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
            className={`min-h-11 rounded-full px-4 font-bold transition ${view === k ? "bg-ink text-white" : "bg-wash text-ink hover:bg-line"}`}>{label}</button>
        ))}
      </div>
      {view === "services" ? <Services /> : <>
      {overview && <Totals o={overview} />}

      <section className="grid gap-3" aria-labelledby="enq-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="enq-title" className="font-display text-2xl font-extrabold text-brand">Enquiries</h2>
          <Button kind="quiet" onClick={load}>Refresh</Button>
        </div>
        <div role="tablist" aria-label="Enquiries" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`min-h-11 rounded-full px-4 font-bold transition ${tab === t.key ? "bg-brand text-white" : "bg-wash text-ink hover:bg-line"}`}>
              {t.label} <span className="opacity-75">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        {rows === null ? <p className="text-muted">Loading…</p>
          : shown.length === 0 ? <p className="rounded-2xl bg-wash p-5 text-muted">{tab === "new" ? "No new enquiries. Messages from in2min2.com/contact appear here." : `Nothing in ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}.`}</p>
          : shown.map((r) => <EnquiryCard key={r.id} r={r} change={change} remove={remove} />)}
      </section>
      </>}
    </>
  );
}

function EnquiryCard({ r, change, remove }: {
  r: Enquiry;
  change: (id: string, patch: Partial<Pick<Enquiry, "status" | "replied_at" | "notes">>) => void;
  remove: (id: string) => void;
}) {
  const [notes, setNotes] = useState(r.notes ?? "");
  const [writing, setWriting] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  async function sendReply() {
    setSending(true); setProblem(null);
    const { data } = await supabase().auth.getSession();
    const res = await fetch("/api/admin/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ id: r.id, message: reply }),
    }).catch(() => null);
    const out = res ? ((await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; detail?: string }) : {};
    setSending(false);
    if (out.ok) {
      // Keep what was sent in the private note, then mark it replied.
      const kept = `${notes ? `${notes}\n\n` : ""}Reply sent ${when(new Date().toISOString())}:\n${reply.trim()}`.slice(-2000);
      setNotes(kept); setReply(""); setWriting(false);
      change(r.id, { status: "replied", replied_at: new Date().toISOString(), notes: kept });
      return;
    }
    setProblem(out.error === "not_set_up" ? "Sending from here isn't switched on yet (the Resend key isn't set on Cloudflare). Use \"Open in my email app\" for now."
      : out.error === "send_failed" ? `Resend didn't send it${out.detail ? `: ${out.detail}` : ""}. Use "Open in my email app" instead.`
      : out.error === "sign_in" || out.error === "not_allowed" ? "Please sign in again."
      : "That didn't send. Please try again.");
  }
  const mail = `mailto:${r.email}?subject=${encodeURIComponent("Re: your message to in2min2")}&body=${encodeURIComponent(
    `Hello ${r.name.split(" ")[0]},\n\n\n\n---\nYou wrote on ${when(r.created_at)}:\n${r.message}`)}`;
  return (
    <article className="grid gap-3 rounded-3xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-xl font-bold">{r.name}</h3>
        <span className="text-sm text-muted">{when(r.created_at)}</span>
      </div>
      <p className="text-[15px]">
        <a className="font-semibold text-brand underline underline-offset-4" href={`mailto:${r.email}`}>{r.email}</a>
        {r.phone && <> · <a className="font-semibold text-brand underline underline-offset-4" href={`tel:${r.phone}`}>{r.phone}</a></>}
        {r.status === "replied" && r.replied_at && <span className="text-muted"> · replied {when(r.replied_at)}</span>}
      </p>
      <p className="whitespace-pre-wrap break-words rounded-2xl bg-wash p-4 text-[17px] leading-relaxed">{r.message}</p>
      <div className="flex flex-wrap gap-2">
        <Button kind="brand" onClick={() => setWriting((w) => !w)}>{writing ? "Close reply" : "Reply here"}</Button>
        <a href={mail} className="inline-flex min-h-12 items-center rounded-full bg-wash px-6 py-3 font-bold text-ink hover:bg-line">Open in my email app</a>
        {r.status !== "replied" && <Button kind="ghost" onClick={() => change(r.id, { status: "replied", replied_at: new Date().toISOString() })}>Mark replied</Button>}
        {r.status !== "archived" && <Button kind="quiet" onClick={() => change(r.id, { status: "archived" })}>Archive</Button>}
        {r.status !== "spam" && <Button kind="quiet" onClick={() => change(r.id, { status: "spam" })}>Spam</Button>}
        {r.status !== "new" && <Button kind="quiet" onClick={() => change(r.id, { status: "new" })}>Back to new</Button>}
        <Button kind="quiet" onClick={() => remove(r.id)}>Delete</Button>
      </div>
      {writing && (
        <div className="grid gap-2 rounded-2xl border-2 border-brand/30 p-3">
          <label htmlFor={`reply-${r.id}`} className="text-sm font-semibold">Your reply to {r.email} <span className="font-normal text-muted">(sent from hello@in2min2.com, with their message below yours)</span></label>
          <textarea id={`reply-${r.id}`} className={`${inputClass} min-h-32 text-[16px]`} value={reply} maxLength={1500} onChange={(e) => setReply(e.target.value)}
            placeholder={`Hello ${r.name.split(" ")[0]},`} />
          {problem && <Notice tone="warn">{problem}</Notice>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm tabular-nums text-muted">{reply.length}/1500</span>
            <Button kind="brand" disabled={sending || !reply.trim()} onClick={() => void sendReply()}>{sending ? "Sending…" : "Send reply"}</Button>
          </div>
        </div>
      )}
      <label className="grid gap-1.5 text-sm font-semibold">
        Private note (only you see this)
        <textarea className={`${inputClass} min-h-20 text-[16px] font-normal`} value={notes} maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { if (notes !== (r.notes ?? "")) change(r.id, { notes: notes.trim() || null }); }} />
      </label>
    </article>
  );
}

function Totals({ o }: { o: Overview }) {
  const max = Math.max(1, ...o.days.map((d) => Math.max(d.events, d.enquiries)));
  const tiles: { label: string; value: number; line: string }[] = [
    { label: "New enquiries", value: o.enquiries.new, line: `${o.enquiries.week} in the last 7 days` },
    { label: "Accounts", value: o.accounts.total, line: `${o.accounts.hosts} have made an event` },
    { label: "Events made", value: o.events.total, line: `${o.events.week} this week · ${o.events.month} this month` },
    { label: "Published", value: o.events.published, line: `${o.events.drafts} still drafts` },
    { label: "Guest replies", value: o.replies.total, line: `${o.replies.week} this week · ${o.replies.attending} people coming` },
    { label: "Photos shared", value: o.photos.total, line: `${o.ai.week} AI writes this week` },
  ];
  return (
    <section className="grid gap-3" aria-labelledby="tot-title">
      <h2 id="tot-title" className="font-display text-2xl font-extrabold text-brand">At a glance</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="grid content-start gap-0.5 rounded-2xl border border-line bg-card p-4">
            <span className="text-sm font-bold text-muted">{t.label}</span>
            <span className="font-display text-3xl font-extrabold text-brand tabular-nums">{t.value}</span>
            <span className="text-[13px] leading-snug text-muted">{t.line}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 rounded-2xl border border-line bg-card p-4">
        <p className="text-sm font-bold text-muted">Last 14 days: <span className="text-brand">■</span> events made · <span className="text-marigold-deep">■</span> enquiries</p>
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Events made and enquiries received each day for 14 days">
          {o.days.map((d) => (
            <div key={d.day} className="flex h-full flex-1 items-end gap-0.5" title={`${d.day}: ${d.events} events, ${d.enquiries} enquiries`}>
              <div className="w-1/2 rounded-t bg-brand" style={{ height: `${(d.events / max) * 100}%`, minHeight: d.events ? 3 : 0 }} />
              <div className="w-1/2 rounded-t bg-marigold-deep" style={{ height: `${(d.enquiries / max) * 100}%`, minHeight: d.enquiries ? 3 : 0 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <List title="Published pages by plan" rows={o.by_plan} empty="None published yet." />
        <List title="Most-made kinds of event" rows={o.by_type} empty="No events yet." />
      </div>
      <div className="grid gap-0.5 rounded-2xl border border-dashed border-line bg-card p-4">
        <p className="text-sm font-bold text-muted">Money</p>
        <p className="text-[15px]">Not connected yet. Stripe payments start from February 2027; sales, refunds and fees will show here once they are built.</p>
        <p className="text-[13px] text-muted">Website visit counts aren&apos;t built either.</p>
      </div>
    </section>
  );
}

function List({ title, rows, empty }: { title: string; rows: { key: string; n: number }[]; empty: string }) {
  return (
    <div className="grid content-start gap-2 rounded-2xl border border-line bg-card p-4">
      <p className="text-sm font-bold text-muted">{title}</p>
      {rows.length === 0 ? <p className="text-muted">{empty}</p>
        : <ul className="grid gap-1">{rows.map((r) => (
          <li key={r.key} className="flex justify-between gap-3"><span className="capitalize">{r.key.replace(/_/g, " ")}</span><strong className="tabular-nums">{r.n}</strong></li>
        ))}</ul>}
    </div>
  );
}

const STATE_STYLE: Record<string, string> = {
  live: "bg-emerald-100 text-emerald-900", check: "bg-amber-100 text-amber-900", planned: "bg-wash text-muted", waiting: "bg-amber-100 text-amber-900",
};

function Services() {
  return (
    <section className="grid gap-3" aria-labelledby="svc-title">
      <h2 id="svc-title" className="font-display text-2xl font-extrabold text-brand">Connected services</h2>
      <p className="text-[15px] text-muted">Every app and account in2min2 uses, so you can find them again. Passwords and keys are never kept here.</p>
      {SERVICES.map((v) => (
        <article key={v.name} className="grid gap-1.5 rounded-2xl border border-line bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold">{v.name}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATE_STYLE[v.state]}`}>{STATE_WORDS[v.state]}</span>
          </div>
          <p className="text-[15px]">{v.does}</p>
          <p className="text-[14px] text-muted"><strong>Sign in:</strong> {v.url ? <a className="font-semibold text-brand underline underline-offset-4" href={v.url} target="_blank" rel="noreferrer">{v.login}</a> : v.login}</p>
          <p className="text-[14px] text-muted"><strong>Cost:</strong> {v.cost}</p>
          {v.note && <p className="text-[14px] text-muted">{v.note}</p>}
        </article>
      ))}
      <div className="grid gap-1.5 rounded-2xl border border-line bg-card p-4">
        <h3 className="font-display text-lg font-bold">Secrets on Cloudflare (names only)</h3>
        <ul className="grid gap-1 text-[15px]">{SECRET_NAMES.map((n) => <li key={n.name}><code className="font-mono text-[14px]">{n.name}</code> <span className="text-muted">· {n.for}</span></li>)}</ul>
        <p className="text-[14px] text-muted">Set or change one with <code className="font-mono">npx wrangler secret put NAME</code>. Never paste a key into a chat or a file.</p>
      </div>
    </section>
  );
}
