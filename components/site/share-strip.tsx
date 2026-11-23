// "Send it on": the apps people already use, shown as their own icons (owner,
// 23 Nov 2026), so visitors see at a glance that in2min2 works with WhatsApp,
// Viber, Messenger, Facebook, texts, email and printed QR codes. Pictures
// only (the website doesn't send anything); the builder's Share screen has
// the working buttons (app/new/share-apps.tsx).

import { AppIcon, APPS, type AppKey } from "@/components/app-icons";

const SHOWN: AppKey[] = ["whatsapp", "viber", "messenger", "facebook", "sms", "email", "qr"];

export function ShareStrip({ compact = false, label = "Send it on" }: { compact?: boolean; label?: string }) {
  const names = SHOWN.map((a) => APPS[a].label).join(", ");
  if (compact) {
    return (
      <div className="s-sharestrip s-sharestrip-compact">
        <span>{label}</span>
        <span className="s-shareicons" role="img" aria-label={`${label}: ${names}`}>
          {SHOWN.map((a) => <AppIcon key={a} app={a} size={32} />)}
        </span>
      </div>
    );
  }
  return (
    <ul className="s-sharestrip" aria-label={`${label}: ${names}`}>
      {SHOWN.map((a) => <li key={a}><AppIcon app={a} size={50} /><span>{APPS[a].label}</span></li>)}
    </ul>
  );
}
