"use client";

// Sharing an event's link: the phone's own share menu where there is one
// (WhatsApp, Messenger, Viber, SMS… whatever is installed; docs/CONCEPT.md),
// otherwise the message and link are copied.

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

// text: an optional ready-made message that goes before the link.
export async function shareLink(url: string, title: string, text?: string): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(text ? { title, text, url } : { title, url });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
      // Some browsers refuse share in a frame or without a tap: fall back to copying.
    }
  }
  return copyLink(text ? `${text}\n${url}` : url);
}

export async function copyLink(text: string): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

// WhatsApp on the host's own phone (or WhatsApp Web), with the message typed in.
export function whatsappUrl(url: string, text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}
