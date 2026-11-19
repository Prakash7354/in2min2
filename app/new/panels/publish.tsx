"use client";

// Check and publish: anything still needed (each one tap away), the web
// address, the price and a launch code, and the host's own check that every
// word is right. Then Publish (signing in first if needed), and the share
// sheet opens.

import { Icon } from "@/components/icons";
import { eventType, formatPence, plan } from "@/lib/catalog";
import { missingForPublish, slugOk, unpublishedChanges } from "@/lib/draft";
import { defaultCredit } from "@/lib/event-view";
import { MISSING_PANEL, useB2 } from "../context";
import { suggestedSlug } from "../kinds";
import { PanelShell } from "../panels";
import { eventLink } from "../sheets";
import { Field, Note, Row, Section, Toggle } from "../ui";

export function PublishPanel() {
  const b = useB2();
  const { d, update, pub } = b;
  const t = eventType(d.eventType);
  const community = d.scale === "community";
  const missing = missingForPublish(d);
  const live = !!d.eventId;
  const changed = unpublishedChanges(d);
  const slug = d.slug || suggestedSlug(d);
  const ready = missing.length === 0 && d.checked;
  const link = eventLink(d);
  const p = plan(d.plan);

  // The host's own line at the bottom ("Hosted by …"), or the family names if given.
  const host = d.credit === null ? "" : d.credit?.name ?? defaultCredit({ scale: d.scale, sensitive: !!t?.sensitive, organiserName: d.organiserName, family: d.family })?.name ?? "";
  const footer = (
    <>
      {pub.error && <p className="b2-note" data-tone="warn" style={{ marginBottom: 6 }}>{pub.error}</p>}
      <button type="button" className="b2-btn b2-primary b2-block" disabled={!ready || pub.busy || (live && !changed)} onClick={() => void b.publish()}>
        <Icon name="check" className="" />
        {pub.busy ? (live ? "Updating…" : "Publishing…") : live ? (changed ? "Update my page" : "Up to date") : b.session ? "Publish" : "Sign in and publish"}
      </button>
      {!ready && !pub.busy && <p className="b2-small" style={{ textAlign: "center" }}>{missing.length ? "Fill in what's still needed, then turn on “I've checked it”." : "Turn on “I've checked it” above to publish."}</p>}
    </>
  );

  return (
    <PanelShell icon="check" title={live ? "Your page" : "Check and publish"} footer={footer}
      line={live ? "Change anything, then update it. The link stays the same." : "A last look, then it's live and ready to share."}>
      {live && link && (
        <Section icon="globe" title={changed ? "Live, with changes waiting" : "Live"} line={changed ? "Guests still see the last version you published." : "Guests see exactly what's here."}>
          <Row icon="share" tone="linear-gradient(135deg, #8b7cff, #ffb627)" label="Share it" line={link.replace(/^https?:\/\//, "")} onClick={() => b.openSheet("share")} />
          {pub.note && <Note>{pub.note}</Note>}
        </Section>
      )}

      <Section icon="list" title="Before you publish">
        {missing.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {missing.map((m) => (
              <button key={m.text} type="button" className="b2-note b2-notebtn" data-tone="warn" onClick={() => b.open(MISSING_PANEL[m.step] ?? "publish")}>
                <span>Still needed: <strong>{m.text.toLowerCase()}</strong></span><Icon name="next" className="size-5" />
              </button>
            ))}
          </div>
        ) : <Note tone="ok">Everything needed is filled in.</Note>}
        {!community && (
          <Field label="Hosted by (shown at the bottom of the page)" hint="So guests know who it's from. Leave empty if you like.">
            <input className="b2-input b2-input-sm" value={host} maxLength={80} placeholder="e.g. The Gurung family"
              onChange={(e) => update((x) => ({ ...x, credit: e.target.value ? { label: x.credit?.label ?? "Hosted by", name: e.target.value } : undefined }))} />
          </Field>
        )}
        <Row icon="eye" label="See it as guests will" line="The invitation, the page, on the day, and after" onClick={() => b.open("preview")} />
        <Toggle icon="check" label="I've checked it" line="The names, date, place and numbers, and every word in every language." checked={d.checked}
          onChange={(v) => update((x) => ({ ...x, checked: v }))} />
      </Section>

      <Section icon="link" title="Web address" line={live ? "Fixed once published, so links already shared keep working." : "Small letters, numbers and hyphens. It can't change once shared, so check it now."}>
        <p className="b2-small" style={{ overflowWrap: "anywhere" }}>in2min2.com/{t?.key ?? "event"}/<strong style={{ color: "var(--b2-text)" }}>{slug || "…"}</strong></p>
        {!live && (
          <input className="b2-input b2-input-sm" value={d.slug} placeholder={suggestedSlug(d) || "our-event"} maxLength={60} aria-label="Web address"
            onChange={(e) => update((x) => ({ ...x, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-") }))} />
        )}
        {!live && d.slug && !slugOk(d.slug) && <Note tone="warn">At least 3 letters or numbers, with single hyphens between words.</Note>}
      </Section>

      <Section icon="tag" title="Price">
        {community ? (
          <p className="b2-small">Free to set up. 4% + 30p on each online order; nothing on cash or free events. Online sales open in February.</p>
        ) : (
          <>
            <p className="b2-h3">{formatPence(0)} to publish</p>
            <p className="b2-small">Paying for a plan opens in February. Until then a published page is on the free plan: online {p.key === "popup" ? "7 days" : p.duration} after the event, up to 200 people.</p>
            {!d.offerClaimed ? (
              <Field label="Have a code?" hint="For example LAUNCH50: a free Keepsake (12 months) for the first 50 families. Checked when you publish.">
                <input className="b2-input b2-input-sm" value={d.offerCode} maxLength={20} placeholder="LAUNCH50"
                  onChange={(e) => update((x) => ({ ...x, offerCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} />
              </Field>
            ) : <Note tone="ok">Your code worked.</Note>}
          </>
        )}
      </Section>
    </PanelShell>
  );
}
