"use client";

// Who it's for: the event's name, the stars of the day and the family to
// honour; or, for a public event, who's organising it. Quick chips for the
// usual words ("The couple", "Grandparents"…), and boxes for anything else.

import { charCount } from "@/lib/ai/copy";
import { Icon } from "@/components/icons";
import { eventType, ORGANISER_TYPES } from "@/lib/catalog";
import { CREDIT_LABELS, creditFor, defaultCredit } from "@/lib/event-view";
import { useB2 } from "../context";
import { kindOf, MEMORIAL_KINDS, titleFor } from "../kinds";
import { PanelShell } from "../panels";
import { MilestonePicker } from "../pickers";
import { ORGANISER_ICON } from "../quick";
import { AddChips, Chips, Field, Section } from "../ui";

const FAMILY = ["Parents", "Grandparents", "Mother", "Father", "Brothers and sisters", "Uncles and aunts", "The family"];

export function PeoplePanel() {
  const { d, update } = useB2();
  const t = eventType(d.eventType);
  const k = kindOf(d.eventType);
  const community = d.scale === "community";
  const auto = titleFor(d);
  const titleIdeas = [...new Set([auto !== d.title ? auto : "", ...(k.titleChips ?? [])].filter((x) => x && x !== d.title))].slice(0, 5);
  const relations = [...new Set([...(k.relations ?? []), t?.starLabel ?? ""].filter(Boolean))];
  const usedFamily = new Set(d.family.map((f) => f.relation.trim().toLowerCase()));
  const editFamily = (i: number, key: "relation" | "names", value: string) =>
    update((x) => ({ ...x, family: x.family.map((f, j) => (j === i ? { ...f, [key]: value } : f)) }));

  return (
    <PanelShell peek icon="people" title={community ? "Who's organising" : "Who it's for"}
      line={community ? "Shown on the page so people know who they're dealing with." : "The stars of the day come first on the card and the page."}>
      <Section icon="star" title="The event's name" line="The big line on the page.">
        <Field label="Name" aside={`${charCount(d.title)}/120`}>
          <input className="b2-input b2-input-sm" value={d.title} maxLength={120} placeholder={`e.g. ${k.example}`}
            onChange={(e) => update((x) => ({ ...x, title: e.target.value }))} />
        </Field>
        {titleIdeas.length > 0 && (
          <Chips label="Ideas for the name" small value={null} options={titleIdeas.map((x) => ({ key: x, label: x }))}
            onChange={(v) => v && update((x) => ({ ...x, title: v }))} />
        )}
      </Section>

      {!community && (
        <Section icon="heart" title={t?.starLabel ?? "Whose day"}>
          <Field label="Names" aside={`${charCount(d.stars.names)}/120`}>
            <input className="b2-input b2-input-sm" value={d.stars.names} maxLength={120} placeholder={k.couple ? "e.g. Meenu & Jose" : `e.g. ${k.example}`}
              onChange={(e) => update((x) => ({ ...x, stars: { ...x.stars, names: e.target.value } }))} />
          </Field>
          <div className="b2-field">
            <span className="b2-label">Shown above the names</span>
            <Chips label="Shown above the names" small value={relations.includes(d.stars.relation) ? d.stars.relation : null}
              options={relations.map((r) => ({ key: r, label: r }))} onChange={(v) => v && update((x) => ({ ...x, stars: { ...x.stars, relation: v } }))} />
            <input className="b2-input b2-input-sm" value={d.stars.relation} maxLength={40} aria-label="Shown above the names" placeholder="Or type your own"
              onChange={(e) => update((x) => ({ ...x, stars: { ...x.stars, relation: e.target.value } }))} />
          </div>
          {k.milestone && <MilestonePicker m={k.milestone} small />}
          {k.memorialKinds && (
            <div className="b2-field">
              <span className="b2-label">What is it?</span>
              <Chips label="What is it?" small value={d.milestone ?? "Remembrance"} options={MEMORIAL_KINDS.map((m) => ({ key: m.key, label: m.key }))}
                onChange={(c) => update((x) => ({ ...x, milestone: c ?? undefined }))} />
            </div>
          )}
        </Section>
      )}

      {!community && (
        <Section icon="heart" title="Family to honour"
          line={t?.sensitive ? "Shown as “With love from”. If you like." : "Parents, grandparents and close family, shown with pride as “With blessings from”. If you like."}>
          {d.family.map((f, i) => (
            <div key={i} className="b2-subcard">
              <input className="b2-input b2-input-sm" list="b2-family" value={f.relation} maxLength={40} aria-label={`Who (${i + 1})`} placeholder="Who, e.g. Grandparents"
                onChange={(e) => editFamily(i, "relation", e.target.value)} />
              <input className="b2-input b2-input-sm" value={f.names} maxLength={120} aria-label={`Their names (${i + 1})`} placeholder="Their names, e.g. Mr & Mrs Gurung"
                onChange={(e) => editFamily(i, "names", e.target.value)} />
              <button type="button" className="b2-btn b2-quiet" style={{ justifySelf: "start" }}
                onClick={() => update((x) => ({ ...x, family: x.family.filter((_, j) => j !== i) }))}>
                <Icon name="trash" className="" />Remove
              </button>
            </div>
          ))}
          <datalist id="b2-family">{FAMILY.map((r) => <option key={r} value={r} />)}</datalist>
          {d.family.length < 6 && (
            <AddChips label="Add family" items={FAMILY.filter((r) => !usedFamily.has(r.toLowerCase())).slice(0, 5)}
              onAdd={(r) => update((x) => ({ ...x, family: [...x.family, { relation: r, names: "" }] }))} />
          )}
        </Section>
      )}

      {community && <OrganiserSection />}
      <CreditSection />
    </PanelShell>
  );
}

function OrganiserSection() {
  const { d, update } = useB2();
  return (
        <Section icon="flag" title="The organiser" line="Needed before a public event can be published.">
          <Field label="Organiser's name" aside={`${charCount(d.organiserName)}/120`}>
            <input className="b2-input b2-input-sm" value={d.organiserName} maxLength={120} placeholder="e.g. Riverside Community Association"
              onChange={(e) => update((x) => ({ ...x, organiserName: e.target.value }))} />
          </Field>
          <div className="b2-field">
            <span className="b2-label">What kind of organiser?</span>
            <Chips label="What kind of organiser?" small value={d.organiserType || null} options={ORGANISER_TYPES.map((o) => ({ key: o.key, label: o.label, icon: ORGANISER_ICON[o.key] }))}
              onChange={(v) => update((x) => ({ ...x, organiserType: v ?? "" }))} />
          </div>
          <div className="b2-field">
            <span className="b2-label">Is anyone making a profit from this event?</span>
            <Chips label="Is anyone making a profit?" small value={d.forProfit === null ? null : d.forProfit ? "yes" : "no"}
              options={[{ key: "no", label: "No: it covers costs or a cause" }, { key: "yes", label: "Yes: a business or person profits" }]}
              onChange={(v) => update((x) => ({ ...x, forProfit: v === null ? null : v === "yes" }))} />
          </div>
          {d.organiserType === "charity" && (
            <Field label="Charity number (if registered)" hint="Small charities don't have to register; leave it empty if you haven't one.">
              <input className="b2-input b2-input-sm" value={d.charityNumber} maxLength={12} placeholder="1234567"
                onChange={(e) => update((x) => ({ ...x, charityNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} />
            </Field>
          )}
          <Field label="Contact to show (phone or email)" hint="People trust a page with a real contact.">
            <input className="b2-input b2-input-sm" value={d.organiserContact} maxLength={120} placeholder="07700 900456"
              onChange={(e) => update((x) => ({ ...x, organiserContact: e.target.value }))} />
          </Field>
        </Section>
  );
}

// The line at the bottom left of the page (owner, 16 Nov 2026: "give
// credibility to the organiser … organised by, hosted by, in memory of …
// default option or edit option"). Made from what's filled in until changed.
function CreditSection() {
  const { d, update } = useB2();
  const t = eventType(d.eventType);
  const made = defaultCredit({ scale: d.scale, sensitive: !!t?.sensitive, organiserName: d.organiserName, family: d.family });
  const shown = creditFor(d.credit, made);
  const label = d.credit?.label ?? made?.label ?? (d.scale === "community" ? "Organised by" : t?.sensitive ? "With love from" : "Hosted by");
  const name = d.credit ? d.credit.name : made?.name ?? "";
  return (
    <Section icon="star" title="At the bottom of the page" line="Who's behind the event, so guests can trust it. “Made with In2Min2” sits small on the right.">
      <Chips label="What it says" small value={d.credit === null ? "none" : label}
        options={[...CREDIT_LABELS.map((l) => ({ key: l as string, label: l })), { key: "none", label: "Don’t show" }]}
        onChange={(v) => update((x) => ({ ...x, credit: !v || v === "none" ? null : { label: v, name } }))} />
      {d.credit !== null && (
        <input className="b2-input b2-input-sm" value={name} maxLength={80} aria-label="Who" placeholder={d.scale === "community" ? "e.g. Riverside Community Association" : "e.g. The Gurung family"}
          onChange={(e) => update((x) => ({ ...x, credit: { label, name: e.target.value } }))} />
      )}
      <p className="b2-small">
        {shown ? <>Guests see: <strong style={{ color: "var(--b2-text)" }}>{shown.label} {shown.name}</strong></> : "Nothing shows on the left."}
        {d.credit !== undefined && made && <> · <button type="button" className="b2-link" onClick={() => update((x) => ({ ...x, credit: undefined }))}>Use “{made.label} {made.name}”</button></>}
      </p>
    </Section>
  );
}
