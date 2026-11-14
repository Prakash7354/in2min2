import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4">
      <div className="grid max-w-md gap-4 text-center">
        <p className="font-display text-xl font-extrabold text-brand">In<span className="text-marigold-deep">2</span>Min<span className="text-marigold-deep">2</span></p>
        <h1 className="font-display text-3xl font-extrabold">We couldn&apos;t find that page</h1>
        <p className="text-muted">Check the link, or ask the host to send it again.</p>
        <Link href="/" className="font-semibold text-brand underline underline-offset-4">Go to In2Min2</Link>
      </div>
    </main>
  );
}
