import { getSupabase, getUser, json } from "./lib/helpers.mjs";

// Fetch entries, optionally filtered by category and/or date range. Auth-checked:
// requires a valid Netlify Identity session. Uses the v1 handler signature because
// Netlify only populates context.clientContext.user for handler-style functions.
export const handler = async (event, context) => {
  // TEMP DIAGNOSTIC — remove after debugging. Reports what the function sees
  // without leaking secrets or real user data.
  if (event.queryStringParameters && event.queryStringParameters.debug === "1") {
    const cc = context.clientContext || null;
    const url = (typeof Netlify !== "undefined" && Netlify.env ? Netlify.env.get("MY_SUPABASE_URL") : process.env.MY_SUPABASE_URL) || "";
    const key = (typeof Netlify !== "undefined" && Netlify.env ? Netlify.env.get("MY_SUPABASE_SERVICE_ROLE_KEY") : process.env.MY_SUPABASE_SERVICE_ROLE_KEY) || "";
    return json(200, {
      clientContextKeys: cc ? Object.keys(cc) : null,
      hasUser: !!(cc && cc.user),
      userType: typeof (cc && cc.user),
      urlLen: url.length,
      urlHost: url.replace(/^https?:\/\//, "").split(".")[0],
      keyLen: key.length,
      keyIsJWT: key.startsWith("eyJ"),
      keyIsSbSecret: key.startsWith("sb_secret"),
      keyIsSbPublishable: key.startsWith("sb_publishable"),
      keyIsAnonLike: key.startsWith("sb_") ? "sb-format" : "other",
    });
  }

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }
  if (!getUser(context)) {
    return json(401, { error: "Not authenticated" });
  }

  const params = event.queryStringParameters || {};
  const category = params.category;
  const from = params.from; // inclusive start date (YYYY-MM-DD)
  const to = params.to; // inclusive end date (YYYY-MM-DD)

  try {
    const supabase = getSupabase();
    let query = supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);

    const { data, error } = await query;
    if (error) {
      return json(500, { error: error.message });
    }
    return json(200, data);
  } catch (err) {
    return json(500, { error: err.message });
  }
};
