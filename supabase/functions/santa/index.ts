import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-santa-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalize = (value: string) => value.trim().toLocaleLowerCase("en-US");
const randomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createDerangement<T>(items: T[]): T[] {
  if (items.length < 2) throw new Error("A Secret Santa group needs at least two participants.");
  // A random permutation is retried until nobody receives themselves.
  // This is efficient for ordinary Secret Santa group sizes.
  for (let attempt = 0; attempt < 10000; attempt++) {
    const candidate = shuffled(items);
    if (candidate.every((item, index) => item !== items[index])) return candidate;
  }
  throw new Error("Could not generate a valid draw. Please try again.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const adminSecret = Deno.env.get("SANTA_ADMIN_SECRET");
  if (!supabaseUrl || !serviceKey || !adminSecret) {
    return json({ error: "Server configuration is incomplete." }, 500);
  }
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Organizer setup is protected by a secret stored only as an Edge Function secret.
  // The response contains usernames and one-time access codes, never assignments.
  if (body.action === "create_draw") {
    if (req.headers.get("x-santa-admin-secret") !== adminSecret) {
      return json({ error: "Not authorized." }, 401);
    }

    const groupName = typeof body.groupName === "string" ? body.groupName.trim() : "";
    const rawNames = Array.isArray(body.usernames) ? body.usernames : [];
    if (!groupName || groupName.length > 100) return json({ error: "Enter a group name (max 100 characters)." }, 400);
    if (rawNames.length < 2 || rawNames.length > 200) {
      return json({ error: "Enter between 2 and 200 usernames." }, 400);
    }
    if (!rawNames.every((n) => typeof n === "string" && n.trim().length > 0 && n.trim().length <= 60)) {
      return json({ error: "Every username must be 1–60 characters." }, 400);
    }

    const usernames = (rawNames as string[]).map((n) => n.trim());
    const normalized = usernames.map(normalize);
    if (new Set(normalized).size !== normalized.length) {
      return json({ error: "Usernames must be unique, ignoring capitalization." }, 400);
    }

    // Generate all assignments before writing anything.
    const shuffledRecipients = createDerangement(usernames.map((_, i) => i));
    const accessCodes = usernames.map(() => randomCode());

    const { data: group, error: groupError } = await db
      .from("santa_groups")
      .insert({ group_name: groupName })
      .select("id")
      .single();
    if (groupError || !group) return json({ error: "Could not create the group." }, 500);

    const participants = await Promise.all(usernames.map(async (username, i) => ({
      group_id: group.id,
      username,
      username_normalized: normalized[i],
      access_code_hash: await sha256(accessCodes[i]),
    })));
    const { data: inserted, error: participantError } = await db
      .from("santa_participants")
      .insert(participants)
      .select("id, username");
    if (participantError || !inserted) {
      await db.from("santa_groups").delete().eq("id", group.id);
      return json({ error: "Could not save participants. No draw was created." }, 500);
    }

    const idByNormalized = new Map(inserted.map((p) => [normalize(p.username), p.id]));
    const ids = usernames.map((name) => idByNormalized.get(normalize(name))!);
    const rows = ids.map((giverId, i) => ({
      group_id: group.id,
      giver_id: giverId,
      recipient_id: ids[shuffledRecipients[i]],
    }));
    const { error: assignmentError } = await db.from("santa_assignments").insert(rows);
    if (assignmentError) {
      await db.from("santa_groups").delete().eq("id", group.id);
      return json({ error: "Could not save the draw. The incomplete group was removed." }, 500);
    }

    return json({
      groupName,
      participants: usernames.map((username, i) => ({ username, accessCode: accessCodes[i] })),
      message: "Draw created. Save and distribute each access code privately; codes are shown only once.",
    }, 201);
  }

  if (body.action === "reveal") {
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const accessCode = typeof body.accessCode === "string" ? body.accessCode.trim().toUpperCase() : "";
    if (!username || !accessCode || username.length > 60 || accessCode.length > 32) {
      return json({ error: "Enter your username and access code." }, 400);
    }

    const { data: candidates, error } = await db
      .from("santa_participants")
      .select("id, group_id, access_code_hash")
      .eq("username_normalized", normalize(username));

    // Usernames can be reused in separate groups; the private code identifies
    // the matching participant without exposing group membership.
    const codeHash = await sha256(accessCode);
    const participant = (candidates || []).find((p) => p.access_code_hash === codeHash);

    // Same generic error for missing username and wrong code.
    if (error || !participant) {
      return json({ error: "Username or access code not recognized." }, 401);
    }

    const { data: assignment, error: assignmentError } = await db
      .from("santa_assignments")
      .select("recipient_id")
      .eq("group_id", participant.group_id)
      .eq("giver_id", participant.id)
      .maybeSingle();
    if (assignmentError || !assignment) return json({ error: "No assignment is available for this participant." }, 404);

    const { data: recipient, error: recipientError } = await db
      .from("santa_participants")
      .select("username")
      .eq("id", assignment.recipient_id)
      .single();
    if (recipientError || !recipient) return json({ error: "Could not retrieve your assignment." }, 500);

    return json({ recipient: recipient.username });
  }

  return json({ error: "Unknown action." }, 400);
});
