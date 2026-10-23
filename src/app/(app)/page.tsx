import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, isValidMonth, monthRange } from "@/lib/dates";
import { inr } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { MonthNav } from "./month-nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month =
    params.month && isValidMonth(params.month) ? params.month : currentMonth();
  const { start, end } = monthRange(month);

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("amount, direction, tagged, category_id, categories(id, name, color)")
    .gte("txn_date", start)
    .lt("txn_date", end);

  const txns = (data ?? []) as unknown as Transaction[];
  const totalSpent = txns
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalReceived = txns
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const untagged = txns.filter((t) => !t.tagged).length;

  const byCategory = new Map<
    string,
    { name: string; color: string; total: number }
  >();
  for (const t of txns) {
    if (t.direction !== "debit") continue;
    const key = t.categories?.id ?? "uncategorized";
    const entry = byCategory.get(key) ?? {
      name: t.categories?.name ?? "Uncategorized",
      color: t.categories?.color ?? "#94a3b8",
      total: 0,
    };
    entry.total += Number(t.amount);
    byCategory.set(key, entry);
  }
  const breakdown = [...byCategory.values()].sort((a, b) => b.total - a.total);
  const maxTotal = breakdown[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Monthly Summary</h1>
        <MonthNav month={month} basePath="/" />
      </div>

      {untagged > 0 && (
        <Link
          href="/tag"
          className="block rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium hover:bg-accent/20"
        >
          {untagged} transaction{untagged === 1 ? "" : "s"} waiting to be
          tagged →
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Total Spent
          </p>
          <p className="mt-1 text-2xl font-bold text-danger">
            {inr(totalSpent)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Total Received
          </p>
          <p className="mt-1 text-2xl font-bold text-success">
            {inr(totalReceived)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Net
          </p>
          <p className="mt-1 text-2xl font-bold">
            {inr(totalReceived - totalSpent)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Spend by Category</h2>
          <Link
            href={`/transactions?month=${month}`}
            className="text-sm text-accent hover:underline"
          >
            View transactions →
          </Link>
        </div>
        {breakdown.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No spending recorded this month.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {breakdown.map((c) => (
              <li key={c.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="text-muted">
                    {inr(c.total)}
                    <span className="ml-2 text-xs">
                      {totalSpent > 0
                        ? `${Math.round((c.total / totalSpent) * 100)}%`
                        : ""}
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxTotal > 0 ? (c.total / maxTotal) * 100 : 0}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
