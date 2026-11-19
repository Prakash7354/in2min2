// Next.js calls this when a page or API route fails on the server
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md).
// The error is noted for the owner's hourly alert email (lib/ops.ts).

import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const message = err instanceof Error ? err.message : String(err);
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  const { recordError } = await import("@/lib/ops");
  await recordError(`${request.method} ${request.path}`, message, { kind: context.routeType, digest });
};
