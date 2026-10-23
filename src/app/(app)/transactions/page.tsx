import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, formatDate, isValidMonth, monthRange } from "@/lib/dates";
import { inr } from "@/lib/format";
import type { Account, Transaction } from "@/lib/types";
import { deleteTransaction } from "../actions";
import { MonthNav } from "../month-nav";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const month =
    params.month && isValidMonth(params.month) ? params.month : currentMonth();
  const accountFilter = params.account ?? "";
  const { start, end } = monthRange(month);

  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, categories(id, name, color), accounts(id, name)")
    .gte("txn_date", start)
    .lt("txn_date", end)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (accountFilter) query = query.eq("account_id", accountFilter);

  const [{ data: txData }, { data: accData }] = await Promise.all([
    query,
    supabase.from("accounts").select("*").order("name"),
  ]);

  const txns = (txData ?? []) as unknown as Transaction[];
  const accounts = (accData ?? []) as Account[];
  const accountQuery = accountFilter ? `&account=${accountFilter}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Transactions</h1>
        <MonthNav
          month={month}
          basePath="/transactions"
          extraQuery={accountQuery}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/transactions?month=${month}`}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !accountFilter
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface hover:border-accent"
          }`}
        >
          All accounts
        </Link>
        {accounts.map((a) => (
          <Link
            key={a.id}
            href={`/transactions?month=${month}&account=${a.id}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              accountFilter === a.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface hover:border-accent"
            }`}
          >
            {a.name}
          </Link>
        ))}
        <a
          href={`/api/export?month=${month}`}
          className="ml-auto rounded-lg border border-border bg-surface px-3 py-1 text-xs font-medium hover:border-accent"
        >
          ⬇ Export CSV
        </a>
      </div>

      {txns.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          No transactions this month.
        </div>
      ) : (
        <ul className="space-y-2">
          {txns.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{t.merchant}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span>{formatDate(t.txn_date)}</span>
                  {t.categories ? (
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.categories.color }}
                      />
                      {t.categories.name}
                    </span>
                  ) : (
                    <span className="text-accent">untagged</span>
                  )}
                  {t.accounts?.name && <span>· {t.accounts.name}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p
                  className={`font-semibold ${
                    t.direction === "debit" ? "text-danger" : "text-success"
                  }`}
                >
                  {t.direction === "debit" ? "−" : "+"}
                  {inr(Number(t.amount))}
                </p>
                <Link
                  href={`/transactions/${t.id}`}
                  className="text-xs text-muted hover:text-foreground"
                  aria-label="Edit"
                >
                  ✏️
                </Link>
                <form action={deleteTransaction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-danger"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
