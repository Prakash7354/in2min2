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
    // 23, as on the balloons in the photo (owner, 21 Nov 2026).
    title: "Sita’s 23rd birthday", stars: { relation: "The birthday star", names: "Sita" }, milestone: "23rd",
    venueName: "Riverside Hall", cover: "/site/birthday-s.jpg", coverFit: "fill",
  });
}

// The two-language example for "Your words, your way": a rich red wedding
// card with the gold Royal frame, as weddings matter most (owner, 21 Nov 2026).
export function wordsSample(): EventViewData {
  return sample("wedding", {
    title: "Meenu & Jose", stars: { relation: "The couple", names: "Meenu & Jose" }, venueName: "The Grand Hall", startTime: "11:00",
    cover: "/site/petals-s.jpg", palette: "sindoor", backdrop: "luminous_red", border: "royal",
    languages: ["en", "ne"],
    copy: { card_headline: "Meenu & Jose are getting married", card_invite_body: "With joy in our hearts, we invite you to celebrate our wedding with us.",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
    translation: { card_headline: "मीनु र जोसको शुभविवाह", card_invite_body: "हाम्रो शुभविवाहमा तपाईंलाई सादर निमन्त्रणा गर्दछौं।",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
  }, 6);
}

// Kinds shown as their own invitation, each in a look the builder offers
// (owner's choices, 21 Nov 2026): Pasni in ritual red with a gold frame,
// the anniversary with painted roses, the memorial dark green with fine gold
// lines and no one's name, so it suits any memorial.
const MEMORIAL_WORDS = "Family and friends are warmly invited to remember a much-loved life, share memories and support one another.";
export function kindSample(kind: string): EventViewData {
  switch (kind) {
    case "pasni": return sample("pasni", { stars: { relation: "", names: "Jeena" }, title: "Jeena’s Pasni", startTime: "10:00",
      cover: "/site/jeena-s.jpg", palette: "sindoor", backdrop: "red_gold_frame", border: "none" });
    case "lhosar": return sample("lhosar", { title: "Tamu Lhosar 2026", organiserName: "Gurung community", organiserType: "community_group", forProfit: false, startTime: "11:00",
      cover: "/site/lhosar-s.jpg" }, 5);
    case "memorial": return sample("memorial", { stars: { relation: "", names: "" }, title: "Remembering with love", venueName: "Community hall", startTime: "14:00",
      cover: "/site/memorial-s.jpg", palette: "emerald_gold", border: "fine_line",
      copy: { card_headline: "Remembering with love", card_invite_body: MEMORIAL_WORDS, landing_page_story: MEMORIAL_WORDS, guest_note_box: "",
        post_event_thank_you: "Thank you for being with us, and for your kind words and support." } });
    case "reunion": return sample("reunion", { title: "Gurkha reunion 2027", venueName: "The Regimental Club", startTime: "12:00" }, 8);
    case "anniversary": return sample("anniversary", { stars: { relation: "", names: "Hari & Sita" }, title: "Hari & Sita’s anniversary", startTime: "19:00",
      cover: "/site/harisita-s.jpg", palette: "lali_gurans", backdrop: "rose_frame", border: "none" });
    default: return sample("bratabandha", { stars: { relation: "", names: "Rohan" }, title: "Rohan’s Bratabandha", startTime: "08:00" });
  }
}
