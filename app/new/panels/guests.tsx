"use client";

// Who's invited (owner, 19 Nov 2026): three ways to invite, and what the
// envelope says.
//   Personal: named guests, each with their own link (guest_crm.invite_token,
//     which can't be guessed). Their name is on the envelope ("To Maya &
//     family"), their reply is already linked to them, and a private event
//     opens only with these links.
//   Shared: one link for friends to pass round; the envelope says the host's
//     "To" line ("Our family and friends").
//   Open: for anyone (teams, stalls, sponsors, a poster); "To Everyone".
// "From" is on every envelope, like a return address, so guests can see at a
// glance it's genuine and not spam. No database change: the guest list,
// links and permissions are in 0001 (Row Level Security: owner and co-hosts).

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { AppIcon } from "@/components/app-icons";
import { Opening } from "@/components/event/opening";
import { toViewData, unpublishedChanges } from "@/lib/draft";
import { defaultTo, envelopeFrom, formatDate, TO_LINES, type InviteWay } from "@/lib/event-view";
import { copyLink, whatsappUrl } from "@/lib/share";
import { supabase } from "@/lib/supabase/client";
import { useB2 } from "../context";
import { PanelShell } from "../panels";
import { eventLink } from "../sheets";
import { Note, Section } from "../ui";

type Guest = { id: string; full_name: string; party_size: number; rsvp_status: string; invite_token: string; invited_at: string | null };

const WAYS: { key: InviteWay; title: string; line: string; icon: "user" | "people" | "megaphone" }[] = [
  { key: "personal", title: "Personal", line: "Named guests, each with their own link and their name on the envelope", icon: "user" },
  { key: "shared", title: "Shared", line: "One link for family and friends to pass round", icon: "people" },
  { key: "open", title: "Open", line: "For anyone: teams, stalls, sponsors, a poster", icon: "megaphone" },
];

const STATUS: Record<string, string> = { invited: "Not replied", attending: "Coming", maybe: "Maybe", declined: "Can't come", waitlist: "Waiting list" };

export function GuestsPanel() {
  const b = useB2();
  const { d, update } = b;
  const data = toViewData(d);
  const way: InviteWay = d.inviteWay ?? (d.scale === "community" ? "open" : "personal");
  const [seeing, setSeeing] = useState<string | null | false>(false);
  const fromAuto = envelopeFrom({ ...data, envFrom: "" });
  const fromChoices = [...new Set([data.credit?.name, d.stars.names, ...d.family.map((f) => f.names), d.organiserName].map((s) => s?.trim()).filter((s): s is string => !!s))].slice(0, 4);
  const title = data.copy.card_headline || data.title || "Your event";

  return (
    <PanelShell icon="envelope" title="Who's invited" line="Choose how you're inviting. Your envelope says who it's from and who it's to, like real post." peek>
      <div className="b2-choices b2-ways" role="radiogroup" aria-label="How you're inviting">
        {WAYS.map((w) => (
          <button key={w.key} type="button" role="radio" aria-checked={way === w.key} className="b2-choice"
            onClick={() => update((x) => {
              // Switching between Shared and Open swaps a ready-made "To" line for one of the new way's; the host's own words stay.
              const cur = x.envTo?.trim() || defaultTo(data);
              const ready = [...TO_LINES.shared, ...TO_LINES.open].includes(cur);
              if (w.key === "personal" || !ready || TO_LINES[w.key].includes(cur)) return { ...x, inviteWay: w.key };
              const next = TO_LINES[w.key][0];
              return { ...x, inviteWay: w.key, envTo: next === defaultTo(data) ? "" : next };
            })}>
            <Icon name={w.icon} className="size-6" />
            <span style={{ display: "grid", gap: 4 }}><strong>{w.title}</strong><span>{w.line}</span></span>
          </button>
        ))}
      </div>

      <Section icon="pen" title="From" line="On every envelope, like the sender's address, so guests know it's really from you.">
        <input className="b2-input" value={d.envFrom ?? ""} maxLength={60} aria-label="From"
          placeholder={fromAuto || "Your names, e.g. The Gurung family"}
          onChange={(e) => update((x) => ({ ...x, envFrom: e.target.value }))} />
        {fromChoices.length > 0 && (
          <div className="b2-chips" role="group" aria-label="Quick choices for From">
            {fromChoices.map((s) => (
              <button key={s} type="button" className="b2-chip b2-chip-sm" aria-pressed={(d.envFrom?.trim() || fromAuto) === s}
                onClick={() => update((x) => ({ ...x, envFrom: s === fromAuto ? "" : s }))}>{s}</button>
            ))}
          </div>
        )}
      </Section>

      {way === "personal" ? <Personal /> : <ToLine way={way} />}

      <button type="button" className="b2-btn b2-secondary" onClick={() => setSeeing(way === "personal" ? "Maya & family" : null)}>
        <Icon name="eye" className="" />See the envelope
      </button>
      {!d.envelope && <Note>The envelope is switched off, so guests go straight to the invitation. Switch it on in Look › Envelope.</Note>}
      {d.eventId && unpublishedChanges(d) && <p className="b2-small">Changes to From and To reach guests when you tap <strong>Update my page</strong> on Home.</p>}
      {seeing !== false && (
        <Opening data={{ ...data, envelope: true }} title={title} to={seeing} id="preview" preview={() => setSeeing(false)} />
      )}
    </PanelShell>
  );
}

// Shared and open invitations: one link, and the line the envelope says.
function ToLine({ way }: { way: Exclude<InviteWay, "personal"> }) {
  const b = useB2();
  const { d, update, say } = b;
  const data = toViewData(d);
  const choices = TO_LINES[way];
  const current = d.envTo?.trim() || defaultTo(data);
  const own = !choices.includes(current);
  const link = eventLink(d);
  const title = d.title.trim() || "our event";
  const message = way === "open"
    ? `You're all invited: ${title}${d.date ? `, ${formatDate(d.date)}` : ""}. Everything you need is here:`
    : `You're invited: ${title}${d.date ? `, ${formatDate(d.date)}` : ""}. Please open the invitation and let us know if you can come:`;
  return (
    <Section icon="envelope" title="To" line={way === "open" ? "Who the open invitation is for. Anyone with the link can open it." : "What the envelope says for everyone who opens the shared link."}>
      <div className="b2-chips" role="radiogroup" aria-label="To">
        {choices.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={current === c} className="b2-chip b2-chip-sm"
            onClick={() => update((x) => ({ ...x, envTo: c === defaultTo(data) ? "" : c }))}>{c}</button>
        ))}
        <button type="button" role="radio" aria-checked={own} className="b2-chip b2-chip-sm"
          onClick={() => update((x) => ({ ...x, envTo: own ? x.envTo : " " }))}>Your own words</button>
      </div>
      {own && (
        <input className="b2-input" value={(d.envTo ?? "").trimStart()} maxLength={60} aria-label="Your own To line" placeholder="e.g. All our friends at the gym"
          onChange={(e) => update((x) => ({ ...x, envTo: e.target.value || " " }))} />
      )}
      {link ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="b2-btn b2-primary" href={whatsappUrl(link, message)} target="_blank" rel="noreferrer"><AppIcon app="whatsapp" bare size={20} />Send on WhatsApp</a>
          <button type="button" className="b2-btn b2-secondary" onClick={async () => { const r = await copyLink(link); say(r === "copied" ? "Link copied." : "Couldn't copy here."); }}>
            <Icon name="copy" className="" />Copy link
          </button>
          {way === "open" && <button type="button" className="b2-btn b2-quiet" onClick={() => b.openSheet("share")}><Icon name="qr" className="" />QR code and poster</button>}
        </div>
      ) : (
        <Note>Publish your page first; then the link to share is here.</Note>
      )}
      {d.isPrivate && <Note tone="warn">Your page is private, so a shared link won&apos;t open it. Choose Personal, or make the page public in Settings.</Note>}
    </Section>
  );
}

// Personal invitations: add names, send each guest their own link.
function Personal() {
  const b = useB2();
  const { d, say } = b;
  const [rows, setRows] = useState<Guest[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [size, setSize] = useState(1);
  const [many, setMany] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const live = !!d.eventId && !!b.session;

  const load = useCallback(async () => {
    if (!d.eventId) return;
    const r = await supabase().from("guest_crm").select("id, full_name, party_size, rsvp_status, invite_token, invited_at")
      .eq("event_id", d.eventId).eq("source", "host").order("created_at", { ascending: true }).limit(1000);
    if (r.error) { setProblem(`Couldn't load your guests. (Details for Claude Code: ${r.error.code ?? ""} ${r.error.message})`); return; }
    setProblem(null);
    setRows(r.data as Guest[]);
  }, [d.eventId]);
  useEffect(() => {
    if (!live) return;
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [live, load]);

  if (!d.eventId) {
    return (
      <Section icon="user" title="Personal invitations">
        <Note>Publish your page first. Then add your guests here, and send each one their own link.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.open("publish")}>Check and publish</button>
      </Section>
    );
  }
  if (!b.session) {
    return (
      <Section icon="user" title="Personal invitations">
        <Note>Sign in to add your guests.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.askSignIn("Sign in to add your guests and send their links.")}>Sign in</button>
      </Section>
    );
  }

  async function add(list: { full_name: string; party_size: number }[]) {
    if (!d.eventId || !list.length) return;
    setBusy(true); setProblem(null);
    const r = await supabase().from("guest_crm").insert(list.map((g) => ({ ...g, event_id: d.eventId, source: "host", rsvp_status: "invited" })));
    setBusy(false);
    if (r.error) { setProblem(`Couldn't add ${list.length === 1 ? "that guest" : "those guests"}. (Details for Claude Code: ${r.error.code ?? ""} ${r.error.message})`); return; }
    setName(""); setSize(1); setMany(null);
    say(list.length === 1 ? `${list[0].full_name} added.` : `${list.length} guests added.`);
    await load();
    b.replies.refresh();
  }
  // One guest per line; a number at the end is how many people: "Maya & family, 4".
  const parse = (text: string) => text.split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 300).map((l) => {
    const m = /^(.*?)[,\s]+(\d{1,3})$/.exec(l);
    const n = m ? Math.min(Math.max(Number(m[2]), 1), 500) : 1;
    return { full_name: (m ? m[1] : l).trim().slice(0, 120), party_size: n };
  }).filter((g) => g.full_name);

  const base = `${window.location.origin}${d.shortPath ?? d.publishedPath ?? ""}`;
  const linkFor = (g: Guest) => `${base}?g=${g.invite_token}`;
  const title = d.title.trim() || "our event";
  const message = (g: Guest) => `Dear ${g.full_name},\nYou're invited: ${title}${d.date ? `, ${formatDate(d.date)}` : ""}. This is your own invitation, with your name on it. Please tap to open it and let us know if you can come:`;
  async function sent(g: Guest) {
    if (g.invited_at) return;
    await supabase().from("guest_crm").update({ invited_at: new Date().toISOString() }).eq("id", g.id);
    setRows((rs) => rs?.map((x) => (x.id === g.id ? { ...x, invited_at: new Date().toISOString() } : x)) ?? rs);
  }
  async function remove(g: Guest) {
    const r = await supabase().from("guest_crm").delete().eq("id", g.id);
    setConfirm(null);
    if (r.error) { setProblem("Couldn't remove that guest. Please try again."); return; }
    say(`${g.full_name} removed. Their link no longer works.`);
    await load();
    b.replies.refresh();
  }

  const people = (rows ?? []).reduce((n, g) => n + g.party_size, 0);
  const u = b.replies.usage;
  return (
    <Section icon="user" title="Personal invitations"
      line="Each guest gets their own link: their name is on the envelope, and their reply is already linked to them. Send each link only to that guest.">
      <form style={{ display: "grid", gap: 10 }} onSubmit={(e) => { e.preventDefault(); if (name.trim()) void add([{ full_name: name.trim().slice(0, 120), party_size: size }]); }}>
        <input className="b2-input" value={name} maxLength={120} aria-label="Guest's name, as it goes on the envelope" placeholder="e.g. Mrs Maya Gurung OBE, or Maya & family"
          onChange={(e) => setName(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="b2-label">How many people</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="b2-round b2-round-sm" aria-label="One fewer" onClick={() => setSize((n) => Math.max(1, n - 1))}><Icon name="minus" className="" /></button>
            <strong style={{ minWidth: 24, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{size}</strong>
            <button type="button" className="b2-round b2-round-sm" aria-label="One more" onClick={() => setSize((n) => Math.min(500, n + 1))}><Icon name="plus" className="" /></button>
          </span>
          <button type="submit" className="b2-btn b2-primary" disabled={busy || !name.trim()} style={{ marginLeft: "auto" }}><Icon name="plus" className="" />Add</button>
        </div>
      </form>
      {many === null ? (
        <button type="button" className="b2-btn b2-quiet" onClick={() => setMany("")}><Icon name="list" className="" />Add several at once</button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <textarea className="b2-input" rows={5} value={many} aria-label="Several guests, one per line" placeholder={"One guest per line, with how many people:\nMaya & family, 4\nUncle Hari, 2\nSunita"}
            onChange={(e) => setMany(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="b2-btn b2-primary" disabled={busy || !parse(many).length} onClick={() => void add(parse(many))}>
              Add {parse(many).length || ""} {parse(many).length === 1 ? "guest" : "guests"}
            </button>
            <button type="button" className="b2-btn b2-quiet" onClick={() => setMany(null)}>Cancel</button>
          </div>
        </div>
      )}
      {problem && <Note tone="warn">{problem}</Note>}
      {rows && rows.length > 0 && (
        <>
          <p className="b2-small">
            {rows.length} {rows.length === 1 ? "invitation" : "invitations"} · {people} {people === 1 ? "person" : "people"} · {rows.filter((g) => g.invited_at).length} sent
            {u?.guest_limit != null && <> · {u.people} of {u.guest_limit} on your plan</>}
          </p>
          <ul className="b2-guests">
            {rows.map((g, i) => (
              <li key={g.id} className="b2-row b2-guest">
                <span className="b2-grow">
                  <strong><span style={{ color: "var(--b2-text-2)", fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span> {g.full_name}</strong>
                  <small>{g.party_size} {g.party_size === 1 ? "person" : "people"} · {g.rsvp_status === "invited" ? (g.invited_at ? "Sent, not replied" : "Not sent yet") : STATUS[g.rsvp_status] ?? g.rsvp_status}</small>
                </span>
                {confirm === g.id ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="b2-chip b2-chip-sm" onClick={() => void remove(g)}>Remove</button>
                    <button type="button" className="b2-chip b2-chip-sm" onClick={() => setConfirm(null)}>Keep</button>
                  </span>
                ) : (
                  <span style={{ display: "flex", gap: 6 }}>
                    <a className="b2-round b2-round-sm b2-wa" href={whatsappUrl(linkFor(g), message(g))} target="_blank" rel="noreferrer"
                      aria-label={`Send ${g.full_name}'s invitation on WhatsApp`} onClick={() => void sent(g)}><AppIcon app="whatsapp" bare size={20} /></a>
                    <button type="button" className="b2-round b2-round-sm" aria-label={`Copy ${g.full_name}'s link`}
                      onClick={async () => { const r = await copyLink(linkFor(g)); if (r === "copied") { say(`${g.full_name}'s link copied.`); void sent(g); } }}>
                      <Icon name="copy" className="" />
                    </button>
                    <button type="button" className="b2-round b2-round-sm" aria-label={`Remove ${g.full_name}`} onClick={() => setConfirm(g.id)}><Icon name="trash" className="" /></button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {rows && rows.length === 0 && <p className="b2-small">No guests yet. Add the first one above.</p>}
      {d.isPrivate
        ? <Note>Your page is private: only these personal links open it.</Note>
        : <p className="b2-small">You can still share one link with everyone else too: choose Shared above.</p>}
    </Section>
  );
}
