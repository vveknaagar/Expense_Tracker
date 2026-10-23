import { todayInIndia } from "@/lib/dates";
import type { Account, Category, Transaction } from "@/lib/types";

export function TransactionForm({
  action,
  categories,
  accounts,
  transaction,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  accounts: Account[];
  transaction?: Transaction;
  submitLabel: string;
}) {
  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <form
      action={action}
      className="max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-5"
    >
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={transaction?.amount ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="direction" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="direction"
            name="direction"
            defaultValue={transaction?.direction ?? "debit"}
            className={inputClass}
          >
            <option value="debit">Debit (spent)</option>
            <option value="credit">Credit (received)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="merchant" className="mb-1 block text-sm font-medium">
          Merchant / Description
        </label>
        <input
          id="merchant"
          name="merchant"
          type="text"
          required
          defaultValue={transaction?.merchant ?? ""}
          placeholder="e.g. Swiggy, Auto fare, Rent"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="txn_date" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="txn_date"
            name="txn_date"
            type="date"
            required
            defaultValue={transaction?.txn_date ?? todayInIndia()}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="category_id"
            className="mb-1 block text-sm font-medium"
          >
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={transaction?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">— Untagged —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="account_id" className="mb-1 block text-sm font-medium">
          Account
        </label>
        <select
          id="account_id"
          name="account_id"
          defaultValue={transaction?.account_id ?? ""}
          className={inputClass}
        >
          <option value="">— None / Cash —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}
