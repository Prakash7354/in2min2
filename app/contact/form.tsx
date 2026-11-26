"use client";

// The contact form. Sends through the database function submit_enquiry (0018),
// never straight into the table. The box called "website" is hidden from
// people; robots fill it in and the database then quietly drops the message.

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button, Field, Notice, inputClass } from "@/app/builder/ui";

const REASONS: Record<string, string> = {
  name: "Please type your name.",
  email: "Please check your email address.",
  phone: "That phone number is too long.",
  message: "Please write a message of at least 5 letters (up to 2,000).",
  too_many: "We've had a lot of messages from you just now. Please try again in an hour, or email us.",
};

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    setBusy(true); setError(null);
    const { data, error: e } = await supabase().rpc("submit_enquiry", {
      p_name: name, p_email: email, p_phone: phone, p_message: message, p_website: website,
    });
    setBusy(false);
    if (e || !data) { setError("Sorry, that didn't send. Please check your signal and try again, or email us."); return; }
    if (!data.ok) { setError(REASONS[data.reason as string] ?? "Sorry, that didn't send. Please try again."); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-6 grid gap-2 rounded-3xl border border-line bg-card p-6" role="status">
        <h2 className="font-display text-2xl font-extrabold text-brand">Thank you, message sent</h2>
        <p className="text-[17px]">We&apos;ll reply to <strong>{email.trim()}</strong>. Please check your junk folder if you don&apos;t see us in a day or two.</p>
      </div>
    );
  }

  return (
    <form className="mt-6 grid gap-4 rounded-3xl border border-line bg-card p-5 sm:p-6" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <Field id="c-name" label="Your name">
        <input id="c-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} required />
      </Field>
      <Field id="c-email" label="Your email" hint="So we can reply. We never share it.">
        <input id="c-email" type="email" inputMode="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} required />
      </Field>
      <Field id="c-phone" label="Phone (if you'd like a call)">
        <input id="c-phone" type="tel" inputMode="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={40} />
      </Field>
      <Field id="c-message" label="Your message" aside={`${message.length}/2000`}>
        <textarea id="c-message" className={`${inputClass} min-h-36`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} required />
      </Field>
      {/* The robot trap: people never see or tab to it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      {error && <Notice tone="warn">{error}</Notice>}
      <Button type="submit" kind="brand" disabled={busy || !name.trim() || !email.trim() || message.trim().length < 5} className="w-full sm:w-auto">
        {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
