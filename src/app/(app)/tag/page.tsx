import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/dates";
import { inr } from "@/lib/format";
import type { Category, MerchantRule, Transaction } from "@/lib/types";
import { tagTransaction } from "../actions";

export default async function TagPage() {
  const supabase = await createClient();

  const [{ data: txData }, { data: catData }, { data: ruleData }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*, accounts(id, name)")
        .eq("tagged", false)
        .order("txn_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("merchant_rules").select("*"),
    ]);

  const txns = (txData ?? []) as unknown as Transaction[];
  const categories = (catData ?? []) as Category[];
  const rules = (ruleData ?? []) as MerchantRule[];
  const ruleMap = new Map(
    rules.map((r) => [r.merchant_pattern, r.category_id])
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">To Tag</h1>

      {txns.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          All caught up — no untagged transactions. 🎉
        </div>
      )}

      {txns.map((t) => {
        const suggestedId = ruleMap.get(t.merchant.toLowerCase());
        const ordered = suggestedId
          ? [
              ...categories.filter((c) => c.id === suggestedId),
              ...categories.filter((c) => c.id !== suggestedId),
            ]
          : categories;

        return (
          <div
            key={t.id}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{t.merchant}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDate(t.txn_date)}
                  {t.accounts?.name ? ` · ${t.accounts.name}` : ""}
                  {t.source === "sms" ? " · SMS" : " · Manual"}
                </p>
              </div>
              <p
                className={`text-lg font-bold ${
                  t.direction === "debit" ? "text-danger" : "text-success"
                }`}
              >
                {t.direction === "debit" ? "−" : "+"}
                {inr(Number(t.amount))}
              </p>
            </div>

            {t.raw_sms && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted hover:text-foreground">
                  View original SMS
                </summary>
                <p className="mt-1 rounded-lg bg-background p-2 font-mono text-xs text-muted">
                  {t.raw_sms}
                </p>
              </details>
            )}

            <form action={tagTransaction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="merchant" value={t.merchant} />
              {ordered.map((c) => {
                const suggested = c.id === suggestedId;
                return (
                  <button
                    key={c.id}
                    type="submit"
                    name="category_id"
                    value={c.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      suggested
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background hover:border-accent"
                    }`}
                  >
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: suggested ? undefined : c.color }}
                    />
                    {c.name}
                    {suggested ? " ★" : ""}
                  </button>
                );
              })}
            </form>
          </div>
        );
      })}
    </div>
  );
}
