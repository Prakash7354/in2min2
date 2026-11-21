// Sample invitations for the website (owner, 21 Nov 2026: real examples, not
// blank boxes). Made with the builder's own starting choices for each kind of
// event (applyType + the ready-made words), so what visitors see is exactly
// what the builder makes. Photos are the site's own (public/site).

import { suggestedWords } from "@/app/new/kinds";
import { applyType, newDraft, toViewData, type Draft } from "@/lib/draft";
import type { EventViewData } from "@/lib/event-view";

// A date a few weeks ahead, so "Saturday 12 December" never looks out of date.
function saturdayAhead(weeks: number, from = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7) + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function sample(kind: string, o: Partial<Draft>, weeks = 3): EventViewData {
  const base = applyType(newDraft(), kind);
  const d: Draft = { ...base, date: saturdayAhead(weeks), startTime: "18:00", venueName: "Community hall", wordsBy: "suggested", ...o };
  return toViewData({ ...d, copy: { ...suggestedWords(d), ...(o.copy ?? {}) } });
}

export function heroSample(): EventViewData {
  return sample("birthday", {
    title: "Sita’s 50th birthday", stars: { relation: "The birthday star", names: "Sita" }, milestone: "50th",
    venueName: "Riverside Hall", cover: "/site/birthday-s.jpg", coverFit: "fill",
  });
}

// The two-language example for "Your words, your way".
export function wordsSample(): EventViewData {
  return sample("wedding", {
    title: "Meenu & Jose", stars: { relation: "The couple", names: "Meenu & Jose" }, venueName: "The Grand Hall", startTime: "11:00",
    languages: ["en", "ne"],
    copy: { card_headline: "Meenu & Jose are getting married", card_invite_body: "With joy in our hearts, we invite you to celebrate our wedding with us.",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
    translation: { card_headline: "मीनु र जोसको शुभविवाह", card_invite_body: "हाम्रो शुभविवाहमा तपाईंलाई सादर निमन्त्रणा गर्दछौं।",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
  }, 6);
}

// Kinds without a photo on the site: shown as their own invitation.
export function kindSample(kind: string): EventViewData {
  switch (kind) {
    case "pasni": return sample("pasni", { stars: { relation: "", names: "Aarav" }, title: "Aarav’s Pasni", startTime: "10:00" });
    case "lhosar": return sample("lhosar", { title: "Tamu Lhosar 2026", organiserName: "Gurung community", organiserType: "community_group", forProfit: false, startTime: "11:00" }, 5);
    case "memorial": return sample("memorial", { stars: { relation: "", names: "Ram Bahadur Gurung" }, title: "Remembering Ram Bahadur Gurung", venueName: "St Mary’s Church", startTime: "14:00" });
    case "reunion": return sample("reunion", { title: "Gurkha reunion 2027", venueName: "The Regimental Club", startTime: "12:00" }, 8);
    case "anniversary": return sample("anniversary", { stars: { relation: "", names: "Hari & Sita" }, title: "Hari & Sita’s anniversary", startTime: "19:00" });
    default: return sample("bratabandha", { stars: { relation: "", names: "Rohan" }, title: "Rohan’s Bratabandha", startTime: "08:00" });
  }
}
