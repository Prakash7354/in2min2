// Sample invitations for the website (owner, 21 Nov 2026: real examples, not
// blank boxes). Made with the builder's own starting choices for each kind of
// event (applyType + the ready-made words), so what visitors see is exactly
// what the builder makes. Photos are the site's own (public/site).

import { suggestedWords } from "@/app/new/kinds";
import type { EventCopy } from "@/lib/ai/copy";
import type { FoodNeed } from "@/lib/catalog";
import { applyType, newDraft, toViewData, type Draft } from "@/lib/draft";
import type { EventViewData } from "@/lib/event-view";

// A date a few weeks ahead, so "Saturday 12 December" never looks out of date.
function saturdayAhead(weeks: number, from = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7) + weeks * 7);
  return d.toISOString().slice(0, 10);
}

// Any words given replace the ready-made ones, box by box.
function sample(kind: string, o: Partial<Omit<Draft, "copy">> & { copy?: Partial<EventCopy> }, weeks = 3): EventViewData {
  const { copy, ...rest } = o;
  const base = applyType(newDraft(), kind);
  const d: Draft = { ...base, date: saturdayAhead(weeks), startTime: "18:00", venueName: "Community hall", wordsBy: "suggested", ...rest };
  return toViewData({ ...d, copy: { ...suggestedWords(d), ...copy } });
}

export function heroSample(): EventViewData {
  return sample("birthday", {
    // 23, as on the balloons in the photo (owner, 21 Nov 2026).
    title: "Sita’s 23rd birthday", stars: { relation: "The birthday star", names: "Sita" }, milestone: "23rd",
    venueName: "Riverside Hall", cover: "/site/birthday-s.jpg", coverFit: "fill",
  });
}

// The two-language example for "Your words, your way": a rich red wedding
// card with a traditional gold border and three photos in a stack, as
// weddings matter most (owner, 21 Nov 2026; not the arch, used too often).
export function wordsSample(): EventViewData {
  return sample("wedding", {
    title: "Meenu & Jose", stars: { relation: "The couple", names: "Meenu & Jose" }, venueName: "The Grand Hall", startTime: "11:00",
    cover: "/site/petals-s.jpg", moreCovers: ["/site/w-heart-s.jpg", "/site/w-ceremony-s.jpg"], photoStyle: "polaroid",
    palette: "sindoor", backdrop: "luminous_red", border: "ornate_flowers",
    languages: ["en", "ne"],
    copy: { card_headline: "Meenu & Jose are getting married", card_invite_body: "With joy in our hearts, we invite you to celebrate our wedding with us.",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
    translation: { card_headline: "मीनु र जोसको शुभविवाह", card_invite_body: "हाम्रो शुभविवाहमा तपाईंलाई सादर निमन्त्रणा गर्दछौं।",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
  }, 6);
}

// Kinds shown as their own invitation, each in a look the builder offers,
// and between them every photo shape (owner's choices, 21 Nov 2026): Pasni in
// ritual red with a gold frame (arch), the anniversary with painted roses
// (heart), the memorial dark green with fine gold lines and no one's name, so
// it suits any memorial (arch), Lhosar and the reunion panoramic (hero).
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
    case "reunion": return sample("reunion", { title: "25th Year Reunion 2027", venueName: "The Regimental Club", startTime: "12:00",
      cover: "/site/reunion-s.jpg", photoStyle: "hero", palette: "royal_blue_gold", backdrop: "glow_royal", border: "khukuri",
      copy: { card_invite_body: "25 years on, it’s time to get together again: old friends, good food and plenty of stories." } }, 8);
    case "anniversary": return sample("anniversary", { stars: { relation: "", names: "Hari & Sita" }, title: "Hari & Sita’s anniversary", startTime: "19:00",
      cover: "/site/harisita-s.jpg", photoStyle: "heart", palette: "lali_gurans", backdrop: "rose_frame", border: "none" });
    default: return sample("bratabandha", { stars: { relation: "", names: "Rohan" }, title: "Rohan’s Bratabandha", startTime: "08:00" });
  }
}

// The top of the website (owner, 22 Nov 2026): six invitations on a phone,
// each with the host's Replies on a tablet beside it, changing together.
// The tablet copies the real Replies and Guests screens (app/new/panels):
// coming, maybe, can't come, not replied (or the waiting list for a
// community event), each reply with its note, "Send a reminder" and "Copy the
// list", and the food needs ticked (0014), as the host sees them.
export type DashReply = { name: string; status: "yes" | "maybe" | "no"; size?: number; note: string; ago: string };
export type Dash = { title: string; when: string; coming: number; maybe: number; cant: number; fourth: [string, number]; bell: number;
  food: [FoodNeed, number][]; replies: DashReply[] };
export type HeroShow = { key: string; label: string; card: EventViewData; dash: Dash };

function whenOf(d: EventViewData): string {
  const day = d.date ? new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "";
  return [day, d.venueName].filter(Boolean).join(" · ");
}

export function heroShows(): HeroShow[] {
  const show = (key: string, label: string, card: EventViewData, dash: Omit<Dash, "title" | "when">): HeroShow =>
    ({ key, label, card, dash: { title: card.title, when: whenOf(card), ...dash } });
  return [
    show("birthday", "Birthday", heroSample(), { coming: 41, maybe: 6, cant: 4, fourth: ["Not replied", 18], bell: 3, food: [["vegetarian", 9], ["vegan", 2], ["nut_allergy", 1]], replies: [
      { name: "Asha", status: "yes", size: 3, note: "Can’t wait! Two of us are vegetarian 🌱", ago: "2 min ago" },
      { name: "Hari", status: "maybe", size: 2, note: "Hoping to come after work.", ago: "1 hour ago" },
      { name: "Kamala", status: "no", note: "So sorry, we’re away. Happy birthday Sita! 🎉", ago: "Yesterday" },
    ] }),
    show("pasni", "Pasni", kindSample("pasni"), { coming: 52, maybe: 5, cant: 3, fourth: ["Not replied", 11], bell: 2, food: [["vegetarian", 14], ["vegan", 3], ["dairy_free", 1]], replies: [
      { name: "Bimala", status: "yes", size: 4, note: "Blessings to little Jeena 🙏 One of us is vegan.", ago: "5 min ago" },
      { name: "Dipak", status: "yes", size: 2, note: "We’ll be there for the ceremony.", ago: "2 hours ago" },
      { name: "Gita", status: "no", note: "Sorry to miss it. Lots of love to Jeena 💛", ago: "Yesterday" },
    ] }),
    show("wedding", "Wedding", wordsSample(), { coming: 128, maybe: 14, cant: 9, fourth: ["Not replied", 37], bell: 5, food: [["vegetarian", 38], ["halal", 12], ["vegan", 6], ["nut_allergy", 3]], replies: [
      { name: "Sarita", status: "yes", size: 2, note: "Congratulations! ❤️ One vegetarian meal, please.", ago: "Just now" },
      { name: "Anita", status: "maybe", size: 3, note: "Waiting to hear about leave. Will confirm soon.", ago: "3 hours ago" },
      { name: "Ram", status: "no", note: "Sorry we’ll miss it. Sending love from Hong Kong!", ago: "Yesterday" },
    ] }),
    show("lhosar", "Lhosar", kindSample("lhosar"), { coming: 236, maybe: 31, cant: 12, fourth: ["Waiting list", 8], bell: 4, food: [["vegetarian", 61], ["halal", 9], ["gluten_free", 4]], replies: [
      { name: "Suman", status: "yes", size: 5, note: "Lhosar ko shubhakamana! 🎉 Is there vegetarian food?", ago: "10 min ago" },
      { name: "Maya", status: "yes", size: 2, note: "We’ll join the cultural dance 💃", ago: "1 hour ago" },
      { name: "Dil", status: "maybe", size: 4, note: "Coming if the children finish football in time.", ago: "Today" },
    ] }),
    show("anniversary", "Anniversary", kindSample("anniversary"), { coming: 46, maybe: 4, cant: 2, fourth: ["Not replied", 6], bell: 2, food: [["vegetarian", 11], ["gluten_free", 2], ["dairy_free", 1]], replies: [
      { name: "Rita", status: "yes", size: 2, note: "So happy for you both 💛 A no-sugar dessert for Dad, please.", ago: "15 min ago" },
      { name: "Prem", status: "yes", size: 4, note: "Wouldn’t miss it! Congratulations!", ago: "2 hours ago" },
      { name: "Laxmi", status: "no", note: "Sorry, we’re in Nepal. Happy anniversary! 🌹", ago: "Yesterday" },
    ] }),
    show("reunion", "Reunion", kindSample("reunion"), { coming: 86, maybe: 10, cant: 7, fourth: ["Not replied", 22], bell: 3, food: [["vegetarian", 15], ["halal", 4], ["gluten_free", 2]], replies: [
      { name: "Bikash", status: "yes", size: 2, note: "25 years! Can’t wait to see the old faces 👋", ago: "Just now" },
      { name: "Nabin", status: "yes", size: 1, note: "Vegetarian, please. See you all there!", ago: "1 hour ago" },
      { name: "Dipak", status: "no", note: "Sorry, I’m overseas that week. Cheers to all!", ago: "Yesterday" },
    ] }),
  ];
}
