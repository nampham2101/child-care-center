import { getSupabase, getUser, json } from "./lib/helpers.mjs";

// Insert one income/expense record. Auth-checked: requires a valid Netlify
// Identity session. Uses the v1 handler signature because Netlify only populates
// context.clientContext.user (the Identity JWT check) for handler-style functions.
export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (!getUser(context)) {
    return json(401, { error: "Not authenticated" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { type, amount, category, date, note } = payload || {};

  if (type !== "income" && type !== "expense") {
    return json(400, { error: "type must be 'income' or 'expense'" });
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    return json(400, { error: "amount must be a non-negative number" });
  }
  if (!category || typeof category !== "string" || !category.trim()) {
    return json(400, { error: "category is required" });
  }
  if (!date || Number.isNaN(Date.parse(date))) {
    return json(400, { error: "a valid date is required" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("entries")
      .insert({
        type,
        amount: amountNum,
        category: category.trim(),
        date,
        note: note ? String(note).trim() : null,
      })
      .select()
      .single();

    if (error) {
      return json(500, { error: error.message });
    }
    return json(201, data);
  } catch (err) {
    return json(500, { error: err.message });
  }
};
