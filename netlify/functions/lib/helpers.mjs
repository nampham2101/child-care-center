import { createClient } from "@supabase/supabase-js";

// Read an env var via Netlify's runtime global, falling back to process.env
// (e.g. when running under plain Node locally).
function env(name) {
  if (typeof Netlify !== "undefined" && Netlify.env) {
    return Netlify.env.get(name);
  }
  return process.env[name];
}

let cachedClient;

// Service-role Supabase client. The service key bypasses RLS and must never
// reach the browser — it only lives here in the serverless runtime.
export function getSupabase() {
  if (!cachedClient) {
    const url = env("MY_SUPABASE_URL");
    const key = env("MY_SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      throw new Error("Supabase environment variables are not configured");
    }
    cachedClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return cachedClient;
}

// Netlify populates context.clientContext.user only when the request carries a
// valid Netlify Identity JWT (validated server-side). Returns the user or null.
export function getUser(context) {
  return (context.clientContext && context.clientContext.user) || null;
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
