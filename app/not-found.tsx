import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4">
      <div className="grid max-w-md gap-4 text-center">
        <p className="text-2xl"><Wordmark /></p>
        <h1 className="font-display text-3xl font-extrabold">We couldn&apos;t find that page</h1>
        <p className="text-muted">Check the link, or ask the host to send it again.</p>
        <Link href="/" className="font-semibold text-brand underline underline-offset-4">Go to in2min2</Link>
      </div>
    </main>
  );
}
