"use client";

// "Or send it with": the apps people already use, as their own icons (owner,
// 23 Nov 2026), under the big WhatsApp button on Share. Viber, Messenger
// (phones only: it can't open on a computer), a text message, email,
// Facebook (not for a private event: only personal links open those), and
// the phone's own share menu for anything else.

import { useState } from "react";
import { AppIcon, APPS, type AppKey } from "@/components/app-icons";
import { emailUrl, facebookUrl, messengerUrl, smsUrl, viberUrl } from "@/lib/share";

export function ShareApps({ url, text, subject, isPrivate, onMore }: { url: string; text: string; subject: string; isPrivate: boolean; onMore: () => void }) {
  const [phone] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const links: [AppKey, string][] = [
    ["viber", viberUrl(url, text)],
    ...(phone ? [["messenger", messengerUrl(url)] as [AppKey, string]] : []),
    ["sms", smsUrl(url, text)],
    ["email", emailUrl(url, text, subject)],
    ...(isPrivate ? [] : [["facebook", facebookUrl(url)] as [AppKey, string]]),
  ];
  return (
    <div className="b2-apps" role="group" aria-label="Or send it with">
      {links.map(([app, href]) => (
        <a key={app} className="b2-app" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          <AppIcon app={app} size={46} />
          <span>{APPS[app].label}</span>
        </a>
      ))}
      <button type="button" className="b2-app" onClick={onMore}>
        <AppIcon app="more" size={46} />
        <span>More</span>
      </button>
    </div>
  );
}
