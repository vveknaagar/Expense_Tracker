import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Account, Category, Transaction } from "@/lib/types";
import { deleteTransaction, updateTransaction } from "../../actions";
import { TransactionForm } from "../../transaction-form";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tx }, { data: catData }, { data: accData }] =
    await Promise.all([
      supabase.from("transactions").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("accounts").select("*").order("name"),
    ]);

  if (!tx) notFound();
  const transaction = tx as Transaction;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Edit Transaction</h1>

      {transaction.raw_sms && (
        <div className="max-w-lg rounded-xl border border-border bg-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Original SMS
          </p>
          <p className="mt-1 font-mono text-xs text-muted">
            {transaction.raw_sms}
          </p>
        </div>
      )}

      <TransactionForm
        action={updateTransaction}
        categories={(catData ?? []) as Category[]}
        accounts={(accData ?? []) as Account[]}
        transaction={transaction}
        submitLabel="Save changes"
      />

      <form action={deleteTransaction} className="max-w-lg">
        <input type="hidden" name="id" value={transaction.id} />
        <button
          type="submit"
          className="w-full rounded-lg border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
        >
          Delete transaction
        </button>
      </form>
    </div>
  );
}
