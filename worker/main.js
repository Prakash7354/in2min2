// The Worker's front door (wrangler.jsonc "main"): the Next.js app that
// OpenNext builds into .open-next/worker.js, plus a job Cloudflare runs at
// 7 minutes past every hour (CONCEPT 21; owner: "safety first", 19 Nov 2026).
//
// Every hour:
//   - asks the database a simple question. This keeps the free Supabase
//     project from pausing, and emails the owner if it stops answering;
//   - emails the owner one list of any errors noted since the last hour
//     (lib/ops.ts), then clears them;
//   - tells the owner if there are new enquiries from /contact (a nudge to open
//     in2min2.com/admin; never the message itself).
// Every night (the 02:07 UTC run, or the next hour's if that one fails):
//   - saves a copy of every table (0012 backup_snapshot) and of the sign-in
//     accounts to the private R2 bucket in2min2-backups (EU), as
//     db/YYYY-MM-DD.json and auth/YYYY-MM-DD.json, and deletes copies older
//     than 30 days. R2 encrypts everything it stores.
//   - on Mondays, a short "all well" email, so the owner knows alerts work.
//
// Needs two Worker secrets, set by the owner in the dashboard:
//   SUPABASE_SECRET_KEY (for the backup) and ALERT_EMAIL (where alerts go;
//   it must be an address verified in Cloudflare Email Routing).
// Without them the job skips that part and says so in the logs.

import { EmailMessage } from "cloudflare:email";
import app from "../.open-next/worker.js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../lib/supabase/config.ts";

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";

const KEEP_DAYS = 30;
const FROM = "alerts@in2min2.com";

const worker = {
  fetch: app.fetch,

  async scheduled(event, env, ctx) {
    ctx.waitUntil(hourly(env, new Date(event.scheduledTime)));
  },
};
export default worker;

async function hourly(env, at) {
  const lines = [];
  const state = await readState(env);

  // 1. Is the database answering? (Also keeps it awake.)
  const dbOk = await fetch(`${SUPABASE_URL}/rest/v1/rpc/offer_places_left`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "content-type": "application/json" },
    body: JSON.stringify({ p_code: "LAUNCH50" }),
  }).then((r) => r.ok).catch(() => false);
  if (!dbOk) {
    state.dbDownSince ??= at.toISOString();
    // First failure, then every 6 hours while it lasts.
    if (!state.dbAlertAt || at - new Date(state.dbAlertAt) > 6 * 3_600_000) {
      lines.push(`The database isn't answering (since ${state.dbDownSince}). If Supabase paused the project: supabase.com › your project › Restore project. Otherwise check status.supabase.com.`);
      state.dbAlertAt = at.toISOString();
    }
  } else if (state.dbDownSince) {
    lines.push(`The database is answering again (it stopped at ${state.dbDownSince}).`);
    state.dbDownSince = null;
    state.dbAlertAt = null;
  }

  // 2. The nightly backup: from 02:07 UTC, and every hour after until one
  // works that day (20 Nov 2026: the first night's didn't arrive). A
  // failure is emailed once a day, not every hour.
  let backupNote = null;
  const day = at.toISOString().slice(0, 10);
  if (at.getUTCHours() >= 2 && state.backupDay !== day) {
    backupNote = await backup(env, at).catch((e) => `Nightly backup FAILED: ${e?.message ?? e}`);
    const bad = backupNote.includes("FAILED") || backupNote.includes("skipped");
    state.lastBackup = { at: at.toISOString(), note: backupNote };
    if (!bad) state.backupDay = day;
    else if (state.backupAlertDay !== day) { lines.push(backupNote); state.backupAlertDay = day; }
  }

  // 3. Errors noted since the last run.
  const errors = await listErrors(env);
  if (errors.length) {
    lines.push(`${errors.length} error${errors.length === 1 ? "" : "s"} on the site in the last hour${errors.length >= 50 ? " (showing the first 50)" : ""}:`);
    for (const e of errors.slice(0, 15)) {
      const m = e.customMetadata ?? {};
      lines.push(`- ${e.key.slice(7, 26).replace("T", " ")} UTC · ${m.where ?? "?"}\n  ${m.message ?? ""}${m.kind ? ` [${m.kind}]` : ""}`);
    }
    if (errors.length > 15) lines.push(`…and ${errors.length - 15} more like these.`);
  }

  // 3b. New enquiries from in2min2.com/contact (0018): one nudge, never the
  // message itself, which lives only in in2min2.com/admin. Needs the secret key.
  let enquiryCount = 0;
  if (env.SUPABASE_SECRET_KEY) {
    const since = state.enquiriesSeen ?? "1970-01-01T00:00:00Z";
    const key = env.SUPABASE_SECRET_KEY;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/enquiries?select=id&status=eq.new&created_at=gt.${encodeURIComponent(since)}&limit=100`, {
      headers: { apikey: key, ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}) },
    }).catch(() => null);
    if (r?.ok) {
      enquiryCount = (await r.json().catch(() => [])).length;
      if (enquiryCount) lines.push(`${enquiryCount} new enquir${enquiryCount === 1 ? "y" : "ies"} on in2min2.com. Open https://in2min2.com/admin to read and reply.`);
    }
  }

  // 4. Monday's "all well", so silence never hides a broken alert.
  const weekly = at.getUTCHours() === 2 && at.getUTCDay() === 1;
  if (weekly && !lines.length) lines.push(`All well this week. ${backupNote ?? ""}`.trim());

  if (lines.length) {
    const subject = errors.length ? `in2min2: ${errors.length} error${errors.length === 1 ? "" : "s"}` : !dbOk ? "in2min2: database not answering"
      : lines.some((l) => l.includes("answering again")) ? "in2min2: database answering again"
      : enquiryCount ? `in2min2: ${enquiryCount} new enquir${enquiryCount === 1 ? "y" : "ies"}`
      : weekly ? "in2min2: weekly check" : "in2min2: backup problem";
    const sent = await email(env, subject, `${lines.join("\n\n")}\n\nSent by the in2min2 Worker's hourly check. Give this email to Claude Code if anything needs fixing.\n`);
    state.lastEmail = { at: at.toISOString(), subject, sent: sent === true, ...(sent === true ? {} : { why: sent || "not set up" }) };
    // Clear the reported errors only once the email has gone.
    if (sent === true && errors.length) await env.BACKUPS.delete(errors.map((e) => e.key));
    if (sent === true && enquiryCount) state.enquiriesSeen = at.toISOString();
    if (sent !== true) console.log("alert (email not sent):", lines.join(" | "));
  }
  // What the job last did, readable with wrangler (ops/state.json), so a
  // problem can be found without the dashboard. Only yes/no for the secrets.
  // The newest few errors too, in case the email can't go.
  if (errors.length) {
    state.recentErrors = errors.slice(-5).map((e) => ({ at: e.key.slice(7, 26), where: e.customMetadata?.where ?? "?", message: String(e.customMetadata?.message ?? "").slice(0, 300) }));
  }
  state.lastRun = at.toISOString();
  state.setup = { secretKey: !!env.SUPABASE_SECRET_KEY, alertEmail: !!env.ALERT_EMAIL, emailBinding: !!env.ALERTS, backups: !!env.BACKUPS };
  await writeState(env, state);
}

async function backup(env, at) {
  const key = env.SUPABASE_SECRET_KEY;
  if (!key) return "Nightly backup skipped: the Worker secret SUPABASE_SECRET_KEY isn't set yet.";
  const day = at.toISOString().slice(0, 10);
  // New secret keys (sb_secret_…) go in "apikey" only; an older service_role key also as a Bearer token.
  const headers = { apikey: key, "content-type": "application/json", ...(key.startsWith("eyJ") ? { authorization: `Bearer ${key}` } : {}) };

  const db = await fetch(`${SUPABASE_URL}/rest/v1/rpc/backup_snapshot`, { method: "POST", headers, body: "{}" });
  if (!db.ok) return `Nightly backup FAILED: the database said ${db.status} ${(await db.text()).slice(0, 200)}`;
  const data = await db.arrayBuffer();
  await env.BACKUPS.put(`db/${day}.json`, data, { httpMetadata: { contentType: "application/json" } });

  // Sign-in accounts (ids and emails; there are no passwords). 1,000 is plenty for the pilot.
  const users = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, { headers });
  const usersNote = users.ok ? "" : ` Accounts copy failed (${users.status}).`;
  if (users.ok) await env.BACKUPS.put(`auth/${day}.json`, await users.arrayBuffer(), { httpMetadata: { contentType: "application/json" } });

  // Keep 30 days.
  const cutoff = new Date(at.getTime() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  const old = [];
  let saved = 0;
  for (const prefix of ["db/", "auth/"]) {
    const list = await env.BACKUPS.list({ prefix, limit: 1000 });
    for (const o of list.objects) {
      if (o.key.slice(prefix.length, prefix.length + 10) < cutoff) old.push(o.key);
      else if (prefix === "db/") saved++;
    }
  }
  if (old.length) await env.BACKUPS.delete(old);
  return `Backup saved (${Math.round(data.byteLength / 1024)} KB); ${saved} nightly copies kept.${usersNote}${usersNote ? " FAILED" : ""}`;
}

async function listErrors(env) {
  if (!env.BACKUPS) return [];
  const list = await env.BACKUPS.list({ prefix: "errors/", limit: 50, include: ["customMetadata"] }).catch(() => null);
  return list?.objects ?? [];
}

// true when sent; otherwise why not (kept in ops/state.json).
async function email(env, subject, text) {
  if (!env.ALERTS || !env.ALERT_EMAIL) return "not set up";
  const raw = [
    `From: in2min2 alerts <${FROM}>`,
    `To: <${env.ALERT_EMAIL}>`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@in2min2.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text.replace(/\r?\n/g, "\r\n"),
  ].join("\r\n");
  try {
    await env.ALERTS.send(new EmailMessage(FROM, env.ALERT_EMAIL, raw));
    return true;
  } catch (e) {
    console.log("alert email failed:", e?.message ?? e);
    return String(e?.message ?? e).slice(0, 200);
  }
}

async function readState(env) {
  try {
    const o = await env.BACKUPS?.get("ops/state.json");
    return o ? await o.json() : {};
  } catch {
    return {};
  }
}
async function writeState(env, state) {
  try { await env.BACKUPS?.put("ops/state.json", JSON.stringify(state)); } catch { /* next hour */ }
}
