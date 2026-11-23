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

// The other apps people share with (owner, 23 Nov 2026), each opening with the
// message typed in where the app allows it. Viber and Messenger open the app
// on a phone; Messenger can take only the link, and only on a phone.
export function viberUrl(url: string, text: string): string {
  return `viber://forward?text=${encodeURIComponent(`${text}\n${url}`)}`;
}
export function smsUrl(url: string, text: string): string {
  return `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;
}
export function emailUrl(url: string, text: string, subject: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
}
export function facebookUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
export function messengerUrl(url: string): string {
  return `fb-messenger://share/?link=${encodeURIComponent(url)}`;
}
