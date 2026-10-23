import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSms } from "@/lib/sms-parser";

export async function POST(req: Request) {
  const expectedSecret = process.env.SMS_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = (await req.json()) as Record<string, unknown>;
    } else {
      const form = await req.formData();
      form.forEach((value, key) => {
        payload[key] = String(value);
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const secret =
    req.headers.get("x-webhook-secret") ??
    (typeof payload.secret === "string" ? payload.secret : undefined);
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const message = String(
    payload.message ?? payload.text ?? payload.sms ?? payload.body ?? ""
  ).trim();
  const sender = String(payload.sender ?? payload.from ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Single-user app: the sole registered user owns all data.
  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const owner = usersData?.users?.[0];
  if (usersError || !owner) {
    return NextResponse.json({ error: "No owner user" }, { status: 500 });
  }

  const parsed = parseSms(message);
  if (!parsed) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Dedupe: identical SMS forwarded twice within 10 minutes.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: duplicates } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", owner.id)
    .eq("raw_sms", message)
    .gte("created_at", since)
    .limit(1);
  if (duplicates && duplicates.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let accountId: string | null = null;
  if (sender) {
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, sender_match")
      .eq("user_id", owner.id)
      .not("sender_match", "is", null);
    const matched = accounts?.find(
      (a) =>
        a.sender_match &&
        sender.toLowerCase().includes(a.sender_match.toLowerCase())
    );
    accountId = matched?.id ?? null;
  }

  const { data: rule } = await supabase
    .from("merchant_rules")
    .select("category_id")
    .eq("user_id", owner.id)
    .eq("merchant_pattern", parsed.merchant.toLowerCase())
    .maybeSingle();
  const categoryId = rule?.category_id ?? null;

  const { error: insertError } = await supabase.from("transactions").insert({
    user_id: owner.id,
    account_id: accountId,
    category_id: categoryId,
    raw_sms: message,
    sender: sender || null,
    amount: parsed.amount,
    direction: parsed.direction,
    merchant: parsed.merchant,
    txn_date: parsed.txnDate,
    tagged: categoryId !== null,
    source: "sms",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, autoTagged: categoryId !== null });
}
