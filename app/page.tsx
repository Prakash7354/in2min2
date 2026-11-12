import Link from "next/link";

// Holding page for the preview address while the platform is built.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">Preview</p>
      <h1 className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">In2Min2</h1>
      <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400">
        Your event page, invitation and photo wall, ready in two minutes. Weddings, birthdays, melas and
        tournaments.
      </p>
      <ul className="mt-8 space-y-2 text-neutral-700 dark:text-neutral-300">
        <li>Invitation and RSVP before the day</li>
        <li>Live schedule and photo uploads on the day</li>
        <li>A memory book with every guest&apos;s photos afterwards</li>
      </ul>
      <div className="mt-10">
        <Link
          href="/builder"
          className="inline-block rounded-lg bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700"
        >
          Try the AI writer
        </Link>
      </div>
    </main>
  );
}
