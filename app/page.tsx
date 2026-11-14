import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

// Holding page for the preview address. The full website (top menu, How it
// works, pricing, communities, contact) comes in phase 2 (docs/CONCEPT.md 18b).

const STEPS = [
  { title: "Choose what you’re celebrating", line: "A birthday, a Pasni, a wedding, a reunion, a tournament or a memorial." },
  { title: "We write it in your languages", line: "English and Nepali, or the two languages your family speaks. You check every word." },
  { title: "Share one link", line: "On WhatsApp or anywhere. It’s the invitation, then the live day, then the memory book." },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Wordmark className="text-[28px]" />
        <Link href="/builder" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-bold text-white hover:bg-brand-deep">
          Start free
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-14 px-4 pb-20 pt-8 sm:pt-16">
        <section className="grid max-w-3xl gap-5">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Invitation · Live day · Memory book</p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            Your event online in <span className="text-brand [box-shadow:inset_0_-0.28em_0_#F4A522]">two minutes</span>
          </h1>
          <p className="text-xl text-muted" lang="ne">तपाईंको कार्यक्रम, दुई मिनेटमा</p>
          <p className="max-w-2xl text-xl">
            From a child’s birthday to a community tournament, a charity walk or a regimental reunion. One link, from
            invitation to memory book.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/builder" className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 text-lg font-bold text-white hover:bg-brand-deep">
              Start free
            </Link>
            <a href="#how" className="inline-flex min-h-12 items-center rounded-full px-7 text-lg font-bold text-brand ring-2 ring-inset ring-brand hover:bg-brand/5">
              See how it works
            </a>
          </div>
        </section>

        <section id="how" aria-labelledby="how-title" className="grid gap-6">
          <h2 id="how-title" className="font-display text-3xl font-extrabold tracking-tight">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid content-start gap-3 rounded-3xl border border-line bg-card p-5">
                <span className="grid size-10 place-items-center rounded-full bg-brand font-display text-lg font-extrabold text-white">{i + 1}</span>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="text-muted">{s.line}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto w-full max-w-5xl px-4 py-6 text-sm text-muted">
          Preview while In2Min2 is being built · A GoChuchuro product
        </p>
      </footer>
    </div>
  );
}
