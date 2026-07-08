import { getSupabase, getUser, json } from "./lib/helpers.mjs";

// Fetch entries, optionally filtered by category and/or date range. Auth-checked:
// requires a valid Netlify Identity session.
export default async (req, context) => {
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }
  if (!getUser(context)) {
    return json(401, { error: "Not authenticated" });
  }

  const params = new URL(req.url).searchParams;
  const category = params.get("category");
  const from = params.get("from"); // inclusive start date (YYYY-MM-DD)
  const to = params.get("to"); // inclusive end date (YYYY-MM-DD)

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

export const config = {
  path: "/api/get-entries",
};
