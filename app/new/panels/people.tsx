"use client";

// Who it's for: the event's name, the stars of the day and the family to
// honour; or, for a public event, who's organising it. Quick chips for the
// usual words ("The couple", "Grandparents"…), and boxes for anything else.

import { charCount } from "@/lib/ai/copy";
import { Icon } from "@/components/icons";
import { eventType, ORGANISER_TYPES } from "@/lib/catalog";
import { useB2 } from "../context";
import { kindOf, MEMORIAL_KINDS, titleFor } from "../kinds";
import { PanelShell } from "../panels";
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
    <PanelShell icon="people" title={community ? "Who's organising" : "Who it's for"}
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
          {k.milestone && (
            <div className="b2-field">
              <span className="b2-label">{k.milestone.label}</span>
              <Chips label={k.milestone.label} small clear value={d.milestone ?? null} options={k.milestone.chips.map((c) => ({ key: c, label: c }))}
                onChange={(c) => update((x) => ({ ...x, milestone: c ?? undefined }))} />
            </div>
          )}
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

      {community && (
        <Section icon="flag" title="The organiser" line="Needed before a public event can be published.">
          <Field label="Organiser's name" aside={`${charCount(d.organiserName)}/120`}>
            <input className="b2-input b2-input-sm" value={d.organiserName} maxLength={120} placeholder="e.g. Riverside Community Association"
              onChange={(e) => update((x) => ({ ...x, organiserName: e.target.value }))} />
          </Field>
          <div className="b2-field">
            <span className="b2-label">What kind of organiser?</span>
            <Chips label="What kind of organiser?" small value={d.organiserType || null} options={ORGANISER_TYPES.map((o) => ({ key: o.key, label: o.label }))}
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
      )}
    </PanelShell>
  );
}
