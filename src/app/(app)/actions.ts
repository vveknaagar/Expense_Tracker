"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayInIndia } from "@/lib/dates";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Tagging
// ---------------------------------------------------------------------------

export async function tagTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const merchant = String(formData.get("merchant") ?? "").trim();
  if (!id || !categoryId) return;

  await supabase
    .from("transactions")
    .update({ category_id: categoryId, tagged: true })
    .eq("id", id);

  if (merchant && merchant.toLowerCase() !== "unknown") {
    await supabase.from("merchant_rules").upsert(
      {
        user_id: user.id,
        merchant_pattern: merchant.toLowerCase(),
        category_id: categoryId,
      },
      { onConflict: "user_id,merchant_pattern" }
    );
    // Apply the new rule to any other untagged transactions from this merchant.
    await supabase
      .from("transactions")
      .update({ category_id: categoryId, tagged: true })
      .eq("tagged", false)
      .ilike("merchant", merchant);
  }

  revalidateAll();
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

function readTransactionForm(formData: FormData) {
  const amount = Number(formData.get("amount"));
  const direction = String(formData.get("direction") ?? "debit");
  const merchant = String(formData.get("merchant") ?? "").trim() || "Unknown";
  const txnDate = String(formData.get("txn_date") ?? "") || todayInIndia();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const accountId = String(formData.get("account_id") ?? "") || null;
  return { amount, direction, merchant, txnDate, categoryId, accountId };
}

export async function addTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const f = readTransactionForm(formData);
  if (!Number.isFinite(f.amount) || f.amount <= 0) return;

  await supabase.from("transactions").insert({
    user_id: user.id,
    account_id: f.accountId,
    category_id: f.categoryId,
    amount: f.amount,
    direction: f.direction,
    merchant: f.merchant,
    txn_date: f.txnDate,
    tagged: f.categoryId !== null,
    source: "manual",
  });

  revalidateAll();
  redirect("/transactions");
}

export async function updateTransaction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const f = readTransactionForm(formData);
  if (!Number.isFinite(f.amount) || f.amount <= 0) return;

  await supabase
    .from("transactions")
    .update({
      account_id: f.accountId,
      category_id: f.categoryId,
      amount: f.amount,
      direction: f.direction,
      merchant: f.merchant,
      txn_date: f.txnDate,
      tagged: f.categoryId !== null,
    })
    .eq("id", id);

  revalidateAll();
  redirect("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("transactions").delete().eq("id", id);
  revalidateAll();
  redirect("/transactions");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function addCategory(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#64748b");
  if (!name) return;
  await supabase
    .from("categories")
    .insert({ user_id: user.id, name, color });
  revalidateAll();
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("categories").delete().eq("id", id);
  revalidateAll();
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function addAccount(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const senderMatch = String(formData.get("sender_match") ?? "").trim();
  if (!name) return;
  await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    sender_match: senderMatch || null,
  });
  revalidateAll();
}

export async function deleteAccount(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("accounts").delete().eq("id", id);
  revalidateAll();
}
