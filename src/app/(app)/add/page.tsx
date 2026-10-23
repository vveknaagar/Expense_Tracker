import { createClient } from "@/lib/supabase/server";
import type { Account, Category } from "@/lib/types";
import { addTransaction } from "../actions";
import { TransactionForm } from "../transaction-form";

export default async function AddTransactionPage() {
  const supabase = await createClient();
  const [{ data: catData }, { data: accData }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("accounts").select("*").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Add Transaction</h1>
      <p className="text-sm text-muted">
        For cash spends or anything not captured via SMS.
      </p>
      <TransactionForm
        action={addTransaction}
        categories={(catData ?? []) as Category[]}
        accounts={(accData ?? []) as Account[]}
        submitLabel="Add transaction"
      />
    </div>
  );
}
