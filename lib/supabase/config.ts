// The Supabase project's two PUBLIC values. Both are designed to sit in the
// browser: what anyone may do is decided by Row Level Security and the grants
// in supabase/migrations. The SECRET key never goes here or anywhere in the
// code; on Cloudflare it is the Worker secret SUPABASE_SECRET_KEY.
//
// Environment variables override these (for a separate test project later).

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://txwpptuijtfeomzmakdx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_2q5ysUE1e7Jcl12sHKdrbQ_6aOqURlG";
