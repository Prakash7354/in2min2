// in2min2.com/new/home: the prototype's event Home now lives in Builder 2.0
// itself, which opens on the Home once an event has its basics.
import { redirect } from "next/navigation";

export default function NewHomePage() {
  redirect("/new");
}
