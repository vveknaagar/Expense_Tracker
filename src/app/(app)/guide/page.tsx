import Link from "next/link";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function Table({
  head,
  rows,
}: {
  head: [string, string];
  rows: [string, string][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-border py-2 pr-4 font-semibold text-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td className="border-b border-border py-2 pr-4 align-top font-medium text-foreground">
                {a}
              </td>
              <td className="border-b border-border py-2 align-top">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const steps = [
  {
    n: "1",
    title: "Bank sends an SMS",
    text: "Every debit/credit on your accounts and UPI apps triggers an SMS alert, like “Rs.245 debited to VPA swiggy@icici…”",
  },
  {
    n: "2",
    title: "Your phone forwards it",
    text: "A Macrodroid/Tasker macro POSTs the SMS text and sender to this app's secure webhook the moment it arrives.",
  },
  {
    n: "3",
    title: "The app parses it",
    text: "Amount, debit/credit, merchant, and date are extracted. OTPs, promos, and balance alerts are discarded. The raw SMS is stored for auditing.",
  },
  {
    n: "4",
    title: "Categorized — or queued",
    text: "Known merchant? Auto-categorized instantly. New merchant? It waits in To Tag for a single tap from you.",
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">How it works</h1>
        <p className="mt-1 text-sm text-muted">
          From bank SMS to monthly summary — and the one tap you do in between.
        </p>
      </div>

      {/* Pipeline */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {s.n}
            </span>
            <p className="mt-2 font-semibold text-foreground">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{s.text}</p>
          </div>
        ))}
      </div>

      <Section title="First-time setup checklist">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>
              <Link href="/settings" className="text-accent hover:underline">
                Settings → Accounts
              </Link>
            </strong>{" "}
            — add one entry per bank account / UPI app. The{" "}
            <strong>sender match</strong> is a fragment of the SMS sender ID
            (e.g. <code>HDFCBK</code> matches <code>VM-HDFCBK</code>) and links
            incoming SMS to the right account.
          </li>
          <li>
            <strong>Settings → Categories</strong> — 12 defaults are seeded;
            add or remove to taste.
          </li>
          <li>
            <strong>Phone forwarding</strong> — set up the Macrodroid macro
            (see &ldquo;Phone setup&rdquo; below). After that, transactions
            flow in by themselves.
          </li>
        </ol>
      </Section>

      <Section title="Daily use: tagging — the only chore">
        <p>
          Open{" "}
          <Link href="/tag" className="text-accent hover:underline">
            To Tag
          </Link>{" "}
          (the nav badge shows how many are waiting). Each card shows merchant,
          amount, date, account, and the original SMS.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Tap one category chip</strong> — that&apos;s the whole job.
            The app saves a rule: <em>this merchant → this category</em>.
          </li>
          <li>
            A chip marked <strong>★</strong> is a suggestion from an existing
            rule.
          </li>
          <li>
            Tagging a merchant also back-fills any other untagged transactions
            from the same merchant.
          </li>
          <li>
            Re-tagging a merchant with a different category updates the rule —
            newest choice wins.
          </li>
        </ul>
        <p>
          After a week of tagging your regular merchants, most transactions
          arrive already categorized.
        </p>
      </Section>

      <Section title="Dashboard, browsing, and fixing">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            The{" "}
            <Link href="/" className="text-accent hover:underline">
              Dashboard
            </Link>{" "}
            shows the month&apos;s <strong>Total Spent</strong> (debits),{" "}
            <strong>Total Received</strong> (credits), <strong>Net</strong>,
            and a per-category breakdown. Untagged transactions still count —
            they appear as &ldquo;Uncategorized&rdquo;.
          </li>
          <li>
            <Link href="/transactions" className="text-accent hover:underline">
              Transactions
            </Link>{" "}
            — browse any month, filter by account, ✏️ edit badly parsed
            records (the raw SMS is shown for reference), 🗑️ delete wrong or
            duplicate ones, and <strong>⬇ Export CSV</strong> for backup.
          </li>
          <li>
            <Link href="/add" className="text-accent hover:underline">
              Add
            </Link>{" "}
            — manual entry for cash spends or anything SMS can&apos;t see.
          </li>
        </ul>
      </Section>

      <Section title="What happens to each incoming SMS">
        <Table
          head={["SMS looks like", "What happens"]}
          rows={[
            [
              "Debit alert (“debited”, “spent”, “paid”…)",
              "Transaction created as debit",
            ],
            [
              "Credit alert (“credited”, “received”, “refund”…)",
              "Transaction created as credit",
            ],
            [
              "OTP, promo, “will be debited” reminder, balance alert",
              "Ignored — nothing is stored",
            ],
            [
              "Same SMS delivered twice within 10 minutes",
              "Deduplicated — stored once",
            ],
            [
              "Sender matches an account’s sender match",
              "Linked to that account",
            ],
            [
              "Merchant matches a learned rule",
              "Auto-categorized, skips To Tag",
            ],
          ]}
        />
        <p>
          The raw SMS is always stored, so a parsing mistake never loses data —
          just edit the transaction by hand.
        </p>
      </Section>

      <Section title="Phone setup (Macrodroid, Android)">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Install Macrodroid from the Play Store and create a macro.</li>
          <li>
            <strong>Trigger:</strong> SMS Received → Any content (or restrict
            to your bank sender IDs).
          </li>
          <li>
            <strong>Action:</strong> HTTP Request — POST, content type{" "}
            <code>application/json</code>, to your deployed webhook URL:
          </li>
        </ol>
        <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs">
          {`POST https://<your-app>/api/webhook/sms

{
  "secret": "<SMS_WEBHOOK_SECRET>",
  "message": "[sms_message]",
  "sender": "[sms_name]"
}`}
        </pre>
        <p>
          Test by forwarding yourself a real bank SMS — it should appear in To
          Tag within seconds. Note: a phone can&apos;t reach{" "}
          <code>localhost</code> on your PC; for the real phone-to-app flow,
          deploy to Vercel first. iOS can&apos;t forward SMS — use manual
          entry there.
        </p>
      </Section>

      <Section title="Troubleshooting">
        <Table
          head={["Symptom", "Likely cause / fix"]}
          rows={[
            [
              "SMS arrived but no transaction",
              "Macro off, wrong URL/secret, or SMS judged non-transactional. Check Macrodroid’s log; add manually if needed.",
            ],
            [
              "Wrong amount / merchant / date",
              "Edit the transaction and fix fields against the shown raw SMS.",
            ],
            [
              "Duplicates",
              "Bank + UPI app each sent a differently-worded SMS for one payment. Delete one.",
            ],
            [
              "Not linked to an account",
              "The account’s sender-match fragment doesn’t appear in the SMS sender ID. Adjust it in Settings.",
            ],
            [
              "Login loops back",
              "Session expired or the database isn’t running (locally: npx supabase start).",
            ],
          ]}
        />
      </Section>

      <Section title="Your data">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Single-user by design — Row Level Security means only your login
            can read or write any row.
          </li>
          <li>
            The webhook is protected by a long random secret; rotate it if you
            ever suspect it leaked.
          </li>
          <li>
            Transactions are kept forever unless you delete them; monthly CSV
            export is your backup.
          </li>
        </ul>
      </Section>
    </div>
  );
}
