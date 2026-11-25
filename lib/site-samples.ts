// Sample invitations for the website (owner, 21 Nov 2026: real examples, not
// blank boxes). Made with the builder's own starting choices for each kind of
// event (applyType + the ready-made words), so what visitors see is exactly
// what the builder makes. Photos are the site's own (public/site).

import { DISHES, kindOf, planFor, suggestedWords } from "@/app/new/kinds";
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
type Choices = Partial<Omit<Draft, "copy">> & { copy?: Partial<EventCopy> };
function draftOf(kind: string, o: Choices, weeks = 3): Draft {
  const { copy, ...rest } = o;
  const base = applyType(newDraft(), kind);
  const d: Draft = { ...base, date: saturdayAhead(weeks), startTime: "18:00", venueName: "Community hall", wordsBy: "suggested", ...rest };
  return { ...d, copy: { ...suggestedWords(d), ...copy } };
}

export function heroSample(): EventViewData {
  return toViewData(heroDraft());
}
function heroDraft(): Draft {
  return draftOf("birthday", {
    // 23, as on the balloons in the photo (owner, 21 Nov 2026).
    title: "Sita’s 23rd birthday", stars: { relation: "The birthday star", names: "Sita" }, milestone: "23rd",
    venueName: "Riverside Hall", cover: "/site/birthday-s.jpg", coverFit: "fill",
  });
}

// The two-language example for "Your words, your way": a rich red wedding
// card with a traditional gold border and three photos in a stack, as
// weddings matter most (owner, 21 Nov 2026; not the arch, used too often).
export function heroWedding(): EventViewData {
  return toViewData(weddingDraft());
}

// "Your words, your way" (owner, 23 Nov 2026: a different look and photo from
// the top's wedding): ivory and gold with golden roses, a wide photo, and
// Hindi under the English, as the site is for every culture.
export function wordsSample(): EventViewData {
  return toViewData(draftOf("wedding", {
    title: "Priya & Arjun", stars: { relation: "The couple", names: "Priya & Arjun" }, venueName: "The Manor House", startTime: "12:00",
    cover: "/site/show-bride-s.jpg", photoStyle: "hero", palette: "burgundy_gold", backdrop: "ivory_frame", border: "golden_roses", envColour: "ivory",
    languages: ["en", "hi"],
    copy: { card_headline: "Priya & Arjun are getting married", card_invite_body: "With love and joy, we invite you to celebrate our wedding with us.",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
    translation: { card_headline: "प्रिया और अर्जुन का शुभ विवाह", card_invite_body: "हमारे शुभ विवाह में आप सादर आमंत्रित हैं।",
      landing_page_story: "", guest_note_box: "", post_event_thank_you: "" },
  }, 6));
}

// "The big days" (owner, 23 Nov 2026: not the same as the other weddings):
// emerald and gold, and two days of events, so the auto-playing phone shows
// the envelope, then the whole page with the mehndi, sangeet, ceremony and
// reception, each with its own day, time and place, and the dinner menu.
export function bigDaySample(): EventViewData {
  const d = draftOf("wedding", {
    title: "Simran & Dev", stars: { relation: "The couple", names: "Simran & Dev" }, venueName: "The Grand Hall", startTime: "11:00",
    cover: "/site/w-heart-s.jpg", photoStyle: "arch", palette: "emerald_gold", backdrop: "jali_emerald", border: "wedding_lines", envColour: "emerald",
    copy: { card_headline: "Simran & Dev are getting married", card_invite_body: "Two families, one celebration. Join us for the mehndi, the sangeet, our wedding and the reception." },
  }, 7);
  const friday = new Date(`${d.date}T12:00:00Z`);
  friday.setUTCDate(friday.getUTCDate() - 1);
  const fri = friday.toISOString().slice(0, 10);
  const menu = [{ course: "Starter", dish: "Samosas and pakoras" }, { course: "Main", dish: "Butter chicken" }, { course: "Main", dish: "Paneer tikka masala" }, { course: "Dessert", dish: "Gulab jamun" }];
  const functions = [
    { id: "b1", title: "Mehndi", date: fri, time: "16:00", place: "Our family home", note: "", meal: false, menu: [] },
    { id: "b2", title: "Sangeet", date: fri, time: "19:30", place: "Our family home", note: "", meal: false, menu: [] },
    { id: "b3", title: "Wedding ceremony", date: d.date, time: "11:00", place: "Riverside Gardens", note: "", meal: false, menu: [] },
    { id: "b4", title: "Reception and dinner", date: d.date, time: "18:30", place: "The Grand Hall", note: "", meal: true, menu },
  ];
  return toViewData({ ...d, functions });
}
function weddingDraft(): Draft {
  return draftOf("wedding", {
    title: "Meenu & Jose", stars: { relation: "The couple", names: "Meenu & Jose" }, venueName: "The Grand Hall", startTime: "11:00",
    cover: "/site/petals-s.jpg", moreCovers: ["/site/w-heart-s.jpg", "/site/w-ceremony-s.jpg"], photoStyle: "polaroid",
    palette: "sindoor", backdrop: "luminous_red", border: "imperial_gold",
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
  return toViewData(kindDraft(kind));
}
// Every kind's sample (the website's page for each kind, lib/kind-pages.ts):
// the owner's photos where there is one, else the site's stock photos, else
// the monogram on the event's colours.
export function kindDraft(kind: string): Draft {
  const community = { organiserName: "Our community group", organiserType: "community_group" as const, forProfit: false };
  switch (kind) {
    case "birthday": return heroDraft();
    case "wedding": return weddingDraft();
    case "pasni": return draftOf("pasni", { stars: { relation: "", names: "Jeena" }, title: "Jeena’s Pasni", startTime: "10:00",
      cover: "/site/jeena-s.jpg", palette: "sindoor", backdrop: "red_gold_frame", border: "none" });
    case "lhosar": return draftOf("lhosar", { title: "Tamu Lhosar 2026", organiserName: "Gurung community", organiserType: "community_group", forProfit: false, startTime: "11:00",
      cover: "/site/lhosar-s.jpg" }, 5);
    case "memorial": return draftOf("memorial", { stars: { relation: "", names: "" }, title: "Remembering with love", venueName: "Community hall", startTime: "14:00",
      cover: "/site/memorial-s.jpg", palette: "emerald_gold", border: "fine_line",
      copy: { card_headline: "Remembering with love", card_invite_body: MEMORIAL_WORDS, landing_page_story: MEMORIAL_WORDS, guest_note_box: "",
        post_event_thank_you: "Thank you for being with us, and for your kind words and support." } });
    case "reunion": return draftOf("reunion", { title: "25th Year Reunion 2027", venueName: "The Regimental Club", startTime: "12:00",
      cover: "/site/reunion-s.jpg", photoStyle: "hero", palette: "royal_blue_gold", backdrop: "glow_royal", border: "khukuri",
      copy: { card_invite_body: "25 years on, it’s time to get together again: old friends, good food and plenty of stories." } }, 8);
    case "anniversary": return draftOf("anniversary", { stars: { relation: "", names: "Hari & Sita" }, title: "Hari & Sita’s anniversary", startTime: "19:00",
      cover: "/site/harisita-s.jpg", photoStyle: "heart", palette: "lali_gurans", backdrop: "rose_frame", border: "none" });
    case "bratabandha": return draftOf("bratabandha", { stars: { relation: "", names: "Rohan" }, title: "Rohan’s Bratabandha", startTime: "08:00" });
    case "ceremony": return draftOf("ceremony", { title: "Naming ceremony for our daughter", startTime: "10:00" });
    case "engagement": return draftOf("engagement", { stars: { relation: "", names: "Asha & Rohit" }, title: "Asha & Rohit’s engagement", startTime: "17:00",
      cover: "/site/w-heart-s.jpg", photoStyle: "heart" }, 5);
    case "party": return draftOf("party", { title: "House-warming party", cover: "/site/party-s.jpg", startTime: "19:00" });
    case "christmas": return draftOf("christmas", { title: "Christmas lunch", cover: "/site/christmas-s.jpg", startTime: "13:00" }, 2);
    case "new-year": return draftOf("new-year", { title: "New Year’s Eve party", cover: "/site/newyear-s.jpg", startTime: "19:30" }, 4);
    case "corporate": return draftOf("corporate", { title: "Annual dinner", cover: "/site/office-s.jpg", venueName: "The Grand Hotel", startTime: "19:00" });
    case "mela": return draftOf("mela", { ...community, title: "Summer Mela", cover: "/site/festival-s.jpg", venueName: "Town park", startTime: "11:00" }, 8);
    case "sport": return draftOf("sport", { ...community, title: "Football tournament", cover: "/site/sport-s.jpg", venueName: "Sports ground", startTime: "09:00" }, 8);
    case "charity": return draftOf("charity", { ...community, title: "Charity fun day", cover: "/site/marquee-s.jpg", venueName: "Village green", startTime: "11:00" }, 6);
    case "community": return draftOf("community", { ...community, title: "Cultural evening", cover: "/site/show-concert-s.jpg", startTime: "18:00" }, 5);
    default: return draftOf(kind, {});
  }
}

// The whole page for a kind (what guests see after the envelope): its sample
// with the day plan ready and a few popular dishes on the menu.
export function fullSample(kind: string): EventViewData {
  const d = kindDraft(kind);
  const dishes = DISHES[kindOf(kind).dishes];
  const menu = [dishes.find(([c]) => c === "Starter"), ...dishes.filter(([c]) => c === "Main").slice(0, 2), dishes.find(([c]) => c === "Dessert")]
    .filter((x): x is [string, string] => !!x).map(([course, dish]) => ({ course, dish }));
  const functions = planFor(d).map((f, i) => ({ ...f, id: `s${i}`, menu: f.meal && kind !== "memorial" ? menu : [] }));
  return toViewData({ ...d, functions });
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
export type HeroShow = { key: string; label: string; card: EventViewData; full: EventViewData; dash: Dash };

function whenOf(d: EventViewData): string {
  const day = d.date ? new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }) : "";
  return [day, d.venueName].filter(Boolean).join(" · ");
}

export function heroShows(): HeroShow[] {
  const show = (key: string, label: string, card: EventViewData, dash: Omit<Dash, "title" | "when">): HeroShow =>
    ({ key, label, card, full: fullSample(key), dash: { title: card.title, when: whenOf(card), ...dash } });
  return [
    show("birthday", "Birthday", heroSample(), { coming: 41, maybe: 6, cant: 4, fourth: ["Not replied", 18], bell: 3, food: [["vegetarian", 9], ["vegan", 2], ["nut_allergy", 1]], replies: [
      { name: "Priya", status: "yes", size: 3, note: "Can’t wait! Two of us are vegetarian 🌱", ago: "2 min ago" },
      { name: "Tom", status: "maybe", size: 2, note: "Hoping to come after work.", ago: "1 hour ago" },
      { name: "Fatima", status: "no", note: "So sorry, we’re away. Happy birthday Sita! 🎉", ago: "Yesterday" },
    ] }),
    show("pasni", "Pasni", kindSample("pasni"), { coming: 52, maybe: 5, cant: 3, fourth: ["Not replied", 11], bell: 2, food: [["vegetarian", 14], ["vegan", 3], ["dairy_free", 1]], replies: [
      { name: "Bimala", status: "yes", size: 4, note: "Blessings to little Jeena 🙏 One of us is vegan.", ago: "5 min ago" },
      { name: "Dipak", status: "yes", size: 2, note: "We’ll be there for the ceremony.", ago: "2 hours ago" },
      { name: "Gita", status: "no", note: "Sorry to miss it. Lots of love to Jeena 💛", ago: "Yesterday" },
    ] }),
    show("wedding", "Wedding", heroWedding(), { coming: 128, maybe: 14, cant: 9, fourth: ["Not replied", 37], bell: 5, food: [["vegetarian", 38], ["halal", 12], ["vegan", 6], ["nut_allergy", 3]], replies: [
      { name: "Simran", status: "yes", size: 2, note: "Congratulations! ❤️ One vegetarian meal, please.", ago: "Just now" },
      { name: "Arjun", status: "maybe", size: 3, note: "Waiting to hear about leave. Will confirm soon.", ago: "3 hours ago" },
      { name: "Sarah", status: "no", note: "Sorry we’ll miss it. Sending love from Hong Kong!", ago: "Yesterday" },
    ] }),
    show("lhosar", "Lhosar", kindSample("lhosar"), { coming: 236, maybe: 31, cant: 12, fourth: ["Waiting list", 8], bell: 4, food: [["vegetarian", 61], ["halal", 9], ["gluten_free", 4]], replies: [
      { name: "Suman", status: "yes", size: 5, note: "Lhosar ko shubhakamana! 🎉 Is there vegetarian food?", ago: "10 min ago" },
      { name: "Maya", status: "yes", size: 2, note: "We’ll join the cultural dance 💃", ago: "1 hour ago" },
      { name: "Dil", status: "maybe", size: 4, note: "Coming if the children finish football in time.", ago: "Today" },
    ] }),
    show("anniversary", "Anniversary", kindSample("anniversary"), { coming: 46, maybe: 4, cant: 2, fourth: ["Not replied", 6], bell: 2, food: [["vegetarian", 11], ["gluten_free", 2], ["dairy_free", 1]], replies: [
      { name: "Neha", status: "yes", size: 2, note: "So happy for you both 💛 A no-sugar dessert for Dad, please.", ago: "15 min ago" },
      { name: "Raj", status: "yes", size: 4, note: "Wouldn’t miss it! Congratulations!", ago: "2 hours ago" },
      { name: "Laxmi", status: "no", note: "Sorry, we’re in Nepal. Happy anniversary! 🌹", ago: "Yesterday" },
    ] }),
    show("reunion", "Reunion", kindSample("reunion"), { coming: 86, maybe: 10, cant: 7, fourth: ["Not replied", 22], bell: 3, food: [["vegetarian", 15], ["halal", 4], ["gluten_free", 2]], replies: [
      { name: "Bikash", status: "yes", size: 2, note: "25 years! Can’t wait to see the old faces 👋", ago: "Just now" },
      { name: "Nabin", status: "yes", size: 1, note: "Vegetarian, please. See you all there!", ago: "1 hour ago" },
      { name: "Dipak", status: "no", note: "Sorry, I’m overseas that week. Cheers to all!", ago: "Yesterday" },
    ] }),
  ];
}
