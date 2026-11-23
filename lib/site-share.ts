// What WhatsApp, Viber and Facebook show when someone shares in2min2.com
// (owner, 21 Nov 2026): the picture with the owner's banner, a title and a
// line that says what in2min2 does and invites people in.
//
// The picture is a plain file in public/share (made from
// scripts/art/share-image.html), not app/opengraph-image.jpg: Next.js sends
// that one in pieces with no size and an odd address, and WhatsApp showed no
// picture at all. Give a changed picture a new file name, so the apps fetch
// it again instead of keeping the old one.
//
// In February, when the festive offer ends: remake the picture without
// "Free until 31 January" and change SHARE_DESCRIPTION.

import type { Metadata } from "next";

export const SHARE_IMAGE = {
  url: "/share/in2min2-festive.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "in2min2: Create, Invite, Celebrate. Your event online in two minutes. Free until 31 January.",
};

export const SHARE_TITLE = "in2min2 · Your event online in two minutes";
export const SHARE_DESCRIPTION =
  "A beautiful invitation in two minutes, replies counted for you, and everyone’s photos on one link. Free until 31 January. Try it now!";

// For every page that doesn't set its own (the root layout).
export const DEFAULT_OPEN_GRAPH: Metadata["openGraph"] = {
  type: "website",
  siteName: "in2min2",
  locale: "en_GB",
  images: [SHARE_IMAGE],
};
