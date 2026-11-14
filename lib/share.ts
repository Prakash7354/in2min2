"use client";

// Sharing an event's link: the phone's own share menu where there is one
// (WhatsApp, Messenger, Viber, SMS… whatever is installed; docs/CONCEPT.md),
// otherwise the link is copied.

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareLink(url: string, title: string): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
      // Some browsers refuse share in a frame or without a tap: fall back to copying.
    }
  }
  return copyLink(url);
}

export async function copyLink(url: string): Promise<ShareResult> {
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

export function whatsappUrl(url: string, title: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}
