"use client";

// The day plan (running order): a suggested plan for this kind of event in
// one tap, timed from the start; quick-add chips; and a menu for each meal,
// with popular dishes to tap. Guests see it in time order, with "On now" and
// "Next" on the day.

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { Draft } from "@/lib/draft";
import { EVENT_TYPES } from "@/lib/catalog";
import { asksFood, formatTime, type MenuItem } from "@/lib/event-view";
import { COURSES, DEFAULT_RUN, MEAL_WORDS, RUN_SUGGESTIONS, nextTime } from "@/lib/running-order";
import { useB2 } from "../context";
import { DISHES, kindOf, planFor } from "../kinds";
import { PanelShell } from "../panels";
import { AddChips, AiHead, Field, Note, Section, Toggle } from "../ui";

type Item = Draft["functions"][number];
const mealLine = (menu: MenuItem[]) => {
  const n = menu.filter((m) => m.dish.trim()).length;
  return n ? `Meal, ${n} ${n === 1 ? "dish" : "dishes"}` : "Meal: add the menu";
};
const MAX = 15;

export function PlanPanel() {
  const { d, update, open } = useB2();
  const community = d.scale === "community";
  const [openId, setOpenId] = useState<string | null>(null);
  const suggestions = RUN_SUGGESTIONS[d.eventType ?? ""] ?? DEFAULT_RUN;
  const used = new Set(d.functions.map((f) => f.title.trim().toLowerCase()));
  const full = d.functions.length >= MAX;
  const suggested = planFor(d);
  const edit = (id: string, patch: Partial<Item>) => update((x) => ({ ...x, functions: x.functions.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const add = (title = "") => {
    const id = `${Date.now().toString(36)}${d.functions.length}`;
    update((x) => {
      const meal = MEAL_WORDS.test(title);
      return { ...x, functions: [...x.functions, { id, title, date: x.date, time: nextTime(x), place: "", note: "", meal, menu: meal ? [{ course: "Main", dish: "" }] : [] }] };
    });
    if (!title) setOpenId(id);
  };
  return (
    <PanelShell peek icon="clock" title={community ? "Programme" : "Day plan"}
      line="What happens when, with a menu for each meal. Guests see it in time order; on the day it shows what's on now.">
      {!d.toggles.schedule && (
        <button type="button" className="b2-note b2-notebtn" data-tone="warn" onClick={() => open("settings")}>
          <span>The {community ? "programme" : "running order"} is switched off, so guests won’t see it. Turn it on in Settings.</span><Icon name="next" className="size-5" />
        </button>
      )}

      {d.functions.length === 0 && (
        <section className="b2-ai">
          <AiHead title="Suggested schedule" line="Based on your event type and start time." />
          <p className="b2-h3" style={{ fontWeight: 600, fontSize: 16 }}>{suggested.map((f) => `${formatTime(f.time).replace(":00", "")} ${f.title}`).join(" · ")}</p>
          <button type="button" className="b2-btn b2-primary b2-block" onClick={() => update((x) => ({ ...x, functions: planFor(x) }))}>
            Use this schedule
          </button>
          <p className="b2-caption">Timed from your start time{d.startTime ? ` (${formatTime(d.startTime)})` : ""}. Change any of it after.</p>
        </section>
      )}

      {d.functions.length > 0 && (
        <Section icon="list" title={`${d.functions.length} ${d.functions.length === 1 ? "thing" : "things"}`} line="Tap one to change its time, add a place or a menu.">
          {d.functions.map((f) => (
            <PlanItem key={f.id} f={f} d={d} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)}
              edit={(patch) => edit(f.id, patch)} remove={() => update((x) => ({ ...x, functions: x.functions.filter((g) => g.id !== f.id) }))} />
          ))}
        </Section>
      )}

      {/* Food needs beside the meals (owner, 23 Nov 2026): on unless switched
          off, e.g. for a bring-your-own event. The same switch as in Settings. */}
      {d.toggles.rsvp && (
        <Section icon="bowlfood" title="Food needs" line="When guests reply, they can tick vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free.">
          <Toggle icon="bowlfood" label="Ask guests about food needs" line="Switch it off if you aren’t serving food, or it’s bring your own."
            checked={asksFood(d.askFood, EVENT_TYPES.find((t) => t.key === d.eventType)?.sensitive ?? false)}
            onChange={(v) => update((y) => ({ ...y, askFood: v }))} />
        </Section>
      )}

      {!full && (
        <Section icon="plus" title="Add">
          <AddChips label="Quick add" items={suggestions.filter((t) => !used.has(t.toLowerCase()))} onAdd={(t) => add(t)} />
          <button type="button" className="b2-btn b2-secondary" onClick={() => add()}><Icon name="plus" className="" />Something else</button>
        </Section>
      )}
    </PanelShell>
  );
}

function PlanItem({ f, d, open, onToggle, edit, remove }: {
  f: Item; d: Draft; open: boolean; onToggle: () => void; edit: (patch: Partial<Item>) => void; remove: () => void;
}) {
  const menu = f.menu ?? [];
  const setMenu = (next: MenuItem[]) => edit({ menu: next });
  const dishes = DISHES[kindOf(d.eventType).dishes].filter(([, dish]) => !menu.some((m) => m.dish.trim().toLowerCase() === dish.toLowerCase()));
  const otherDay = f.date && d.date && f.date !== d.date;
  return (
    <div className="b2-subcard" data-open={open ? "" : undefined}>
      <button type="button" className="b2-planrow" onClick={onToggle} aria-expanded={open}>
        <span className="b2-plantime">{f.time ? formatTime(f.time).replace(":00", "") : "–"}</span>
        <span className="b2-grow"><strong>{f.title || "Something new"}</strong>
          {(f.meal || otherDay || f.place) && <small>{[f.meal && mealLine(menu), otherDay && "another day", f.place].filter(Boolean).join(" · ")}</small>}
        </span>
        <Icon name={open ? "close" : "pen"} className="size-5" />
      </button>
      {open && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 8.5rem) minmax(0, 1fr)", gap: 10 }}>
            <Field label="Time"><input className="b2-input b2-input-sm" type="time" value={f.time} onChange={(e) => edit({ time: e.target.value })} /></Field>
            <Field label="What">
              <input className="b2-input b2-input-sm" list="b2-run" value={f.title} maxLength={80} placeholder="e.g. Welcome speech"
                onChange={(e) => edit({ title: e.target.value })} />
            </Field>
          </div>
          <datalist id="b2-run">{(RUN_SUGGESTIONS[d.eventType ?? ""] ?? DEFAULT_RUN).map((t) => <option key={t} value={t} />)}</datalist>
          <Field label="Where, if somewhere else"><input className="b2-input b2-input-sm" value={f.place} maxLength={120} placeholder="e.g. Main hall" onChange={(e) => edit({ place: e.target.value })} /></Field>
          {d.scale !== "personal" && (
            <Field label="Date, if a different day"><input className="b2-input b2-input-sm" type="date" value={f.date} onChange={(e) => edit({ date: e.target.value })} /></Field>
          )}
          <Field label="A short note" aside={`${(f.note ?? "").length}/140`}>
            <input className="b2-input b2-input-sm" value={f.note ?? ""} maxLength={140} placeholder="e.g. Tea and coffee in the foyer" onChange={(e) => edit({ note: e.target.value })} />
          </Field>
          <Toggle icon="bowlfood" label="It's a meal" line="Add what's on the menu" checked={!!f.meal}
            onChange={(v) => edit({ meal: v, menu: v && !menu.length ? [{ course: "Main", dish: "" }] : menu })} />
          {f.meal && (
            <div className="b2-menu">
              {!d.toggles.menu && <Note tone="warn">The food menu is switched off in Settings, so guests won’t see it.</Note>}
              <datalist id="b2-courses">{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
              {menu.map((m, j) => (
                <div key={j} className="b2-dish">
                  <input className="b2-input b2-input-sm" list="b2-courses" value={m.course} maxLength={40} aria-label={`Course for dish ${j + 1}`} placeholder="Course"
                    onChange={(e) => setMenu(menu.map((x, i) => (i === j ? { ...x, course: e.target.value } : x)))} />
                  <input className="b2-input b2-input-sm" value={m.dish} maxLength={160} aria-label={`Dish ${j + 1}`} placeholder="Dish, e.g. Dal bhat"
                    onChange={(e) => setMenu(menu.map((x, i) => (i === j ? { ...x, dish: e.target.value } : x)))} />
                  <button type="button" className="b2-round b2-round-sm" aria-label={`Remove dish ${j + 1}`} onClick={() => setMenu(menu.filter((_, i) => i !== j))}>
                    <Icon name="close" className="" />
                  </button>
                </div>
              ))}
              {menu.length < 20 && (
                <>
                  <AddChips label="Popular dishes" items={dishes.slice(0, 8).map(([, dish]) => dish)}
                    onAdd={(dish) => {
                      const course = dishes.find(([, x]) => x === dish)?.[0] ?? "Main";
                      // Fill an empty line first, otherwise add one.
                      const empty = menu.findIndex((m) => !m.dish.trim());
                      setMenu(empty >= 0 ? menu.map((m, i) => (i === empty ? { course, dish } : m)) : [...menu, { course, dish }]);
                    }} />
                  <button type="button" className="b2-btn b2-quiet" style={{ justifySelf: "start" }}
                    onClick={() => setMenu([...menu, { course: menu[menu.length - 1]?.course ?? "Main", dish: "" }])}>
                    <Icon name="plus" className="" />Add a dish
                  </button>
                </>
              )}
              <p className="b2-small">Tip: mark dishes (V) vegetarian, (VG) vegan or (GF) gluten-free. Dishes under the same course are grouped.</p>
            </div>
          )}
          <button type="button" className="b2-btn b2-quiet" style={{ justifySelf: "start" }} onClick={remove}><Icon name="trash" className="" />Remove</button>
        </div>
      )}
    </div>
  );
}
