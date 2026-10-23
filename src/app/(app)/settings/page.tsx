import { createClient } from "@/lib/supabase/server";
import type { Account, Category } from "@/lib/types";
import {
  addAccount,
  addCategory,
  deleteAccount,
  deleteCategory,
} from "../actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: catData }, { data: accData }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("accounts").select("*").order("name"),
  ]);
  const categories = (catData ?? []) as Category[];
  const accounts = (accData ?? []) as Account[];

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Categories */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Categories</h2>
        <p className="mt-1 text-sm text-muted">
          Tap-to-tag choices. Deleting a category untags its transactions.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
              <form action={deleteCategory} className="inline">
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  className="text-muted hover:text-danger"
                  aria-label={`Delete ${c.name}`}
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addCategory} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            name="name"
            type="text"
            required
            placeholder="New category name"
            className={inputClass}
          />
          <input
            name="color"
            type="color"
            defaultValue="#6366f1"
            className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background"
            aria-label="Category color"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Add category
          </button>
        </form>
      </section>

      {/* Accounts */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Accounts</h2>
        <p className="mt-1 text-sm text-muted">
          One per bank account or UPI app. &ldquo;Sender match&rdquo; is a text
          fragment of the SMS sender ID (e.g.{" "}
          <code className="rounded bg-background px-1">HDFCBK</code> matches
          sender <code className="rounded bg-background px-1">VM-HDFCBK</code>)
          used to link incoming SMS to this account.
        </p>
        <ul className="mt-4 space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
            >
              <span>
                <span className="font-medium">{a.name}</span>
                {a.sender_match && (
                  <span className="ml-2 text-xs text-muted">
                    matches &ldquo;{a.sender_match}&rdquo;
                  </span>
                )}
              </span>
              <form action={deleteAccount}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="text-xs text-muted hover:text-danger"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
          {accounts.length === 0 && (
            <li className="text-sm text-muted">No accounts yet.</li>
          )}
        </ul>
        <form action={addAccount} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            name="name"
            type="text"
            required
            placeholder="Account name (e.g. HDFC Savings)"
            className={inputClass}
          />
          <input
            name="sender_match"
            type="text"
            placeholder="Sender match (e.g. HDFCBK)"
            className={inputClass}
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Add account
          </button>
        </form>
      </section>

      {/* Webhook help */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold">SMS Webhook</h2>
        <p className="mt-1 text-sm text-muted">
          Point your phone automation (Macrodroid / Tasker) at this endpoint.
          It accepts JSON or form data.
        </p>
        <div className="mt-3 space-y-2 font-mono text-xs">
          <p className="rounded-lg bg-background p-3">
            POST https://&lt;your-domain&gt;/api/webhook/sms
          </p>
          <p className="rounded-lg bg-background p-3">
            {`{ "secret": "<SMS_WEBHOOK_SECRET>", "message": "<sms text>", "sender": "<sms sender>" }`}
          </p>
        </div>
        <p className="mt-3 text-sm text-muted">
          The secret is the <code className="rounded bg-background px-1">SMS_WEBHOOK_SECRET</code>{" "}
          environment variable. You can also send it as an{" "}
          <code className="rounded bg-background px-1">x-webhook-secret</code>{" "}
          header. Non-transactional SMS (OTPs, promos) are ignored
          automatically.
        </p>
      </section>
    </div>
  );
}
