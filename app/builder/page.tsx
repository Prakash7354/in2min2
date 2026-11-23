import type { Metadata } from "next";
import BuilderLoader from "./loader";

export const metadata: Metadata = {
  title: "Create your event · in2min2",
  description: "Pick what you're celebrating, add the facts, and see your invitation and event page come to life as you type.",
  robots: { index: false },
};

export default function BuilderPage() {
  return <BuilderLoader />;
}
