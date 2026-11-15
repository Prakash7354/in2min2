"use client";

// Photos waiting to send, kept on the guest's phone (IndexedDB) so a weak
// signal, a closed tab or a flat battery doesn't lose them: they send
// themselves next time the page is open (CONCEPT 12a). Where the phone
// can't keep them (some private-browsing modes), they wait in memory instead.

export type Queued = {
  qid: string;
  wall: string;                   // "{type}/{slug}"
  type: string; slug: string; token: string | null; device: string; name: string;
  pg?: string;                    // a photographer's upload key (0009): sent with that instead
  photo: Blob; thumb: Blob; w: number; h: number;
  added: number; tries: number;
};

export type SendResult =
  | { ok: true; status: "shown" | "waiting"; left: number | null }
  | { ok: false; reason: string };

const DB = "in2min2-photos", STORE = "queue";
const memory = new Map<string, Queued>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function db(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((ok) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: "qid" }); };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(null);
      req.onblocked = () => ok(null);
    } catch { ok(null); }
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return db().then((d) => new Promise((ok) => {
    if (!d) return ok(null);
    try {
      const req = fn(d.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(null);
    } catch { ok(null); }
  }));
}

export async function queuePut(item: Queued): Promise<void> {
  const r = await run("readwrite", (s) => s.put(item));
  if (r === null) memory.set(item.qid, item);
}

export async function queueDelete(qid: string): Promise<void> {
  memory.delete(qid);
  await run("readwrite", (s) => s.delete(qid));
}

export async function queueList(wall: string): Promise<Queued[]> {
  const all = ((await run<Queued[]>("readonly", (s) => s.getAll())) ?? []).concat([...memory.values()]);
  const seen = new Set<string>();
  return all.filter((x) => x.wall === wall && !seen.has(x.qid) && seen.add(x.qid)).sort((a, b) => a.added - b.added);
}

export async function sendPhoto(item: Queued): Promise<SendResult> {
  const q = item.pg
    ? new URLSearchParams({ pg: item.pg, w: String(item.w), h: String(item.h), tl: String(item.thumb.size) })
    : new URLSearchParams({ type: item.type, slug: item.slug, device: item.device, w: String(item.w), h: String(item.h), tl: String(item.thumb.size) });
  if (!item.pg && item.token) q.set("g", item.token);
  if (!item.pg && item.name.trim()) q.set("name", item.name.trim().slice(0, 60));
  try {
    const res = await fetch(`/api/photos?${q}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Blob([item.thumb, item.photo], { type: "application/octet-stream" }),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; reason?: string; status?: "shown" | "waiting"; left?: number | null } | null;
    if (body?.ok && body.status) return { ok: true, status: body.status, left: body.left ?? null };
    return { ok: false, reason: body?.reason ?? (res.status >= 500 ? "server" : "bad_photo") };
  } catch {
    return { ok: false, reason: "network" };
  }
}
