# Expense Tracker — User Guide

A guide to how the app works and how to use it day to day.

---

## 1. The big picture

The app removes manual expense tracking by turning your bank/UPI SMS alerts
into categorized transactions automatically:

```
 Bank sends SMS          Your phone forwards it        The app parses it
┌──────────────┐        ┌──────────────────────┐      ┌─────────────────────┐
│ "Rs.245      │  ───▶  │ Macrodroid detects   │ ───▶ │ Webhook checks the  │
│  debited to  │        │ the SMS and POSTs it │      │ secret, extracts    │
│  VPA swiggy@ │        │ to /api/webhook/sms  │      │ amount / merchant / │
│  icici..."   │        └──────────────────────┘      │ date / debit-credit │
└──────────────┘                                      └──────────┬──────────┘
                                                                 │
                       ┌─────────────────────────────────────────▼─────────┐
                       │  Known merchant?  → auto-categorized, done.       │
                       │  New merchant?    → lands in "To Tag" for you.    │
                       └───────────────────────────────────────────────────┘
```

You only ever do one thing by hand: **tap a category** the first time a new
merchant appears. The app remembers that choice and applies it automatically
from then on.

---

## 2. First-time setup checklist

1. **Sign in** at the app URL (local: http://localhost:3000).
2. **Settings → Accounts** — add one entry per bank account / UPI app:
   - *Name*: whatever you call it, e.g. `HDFC Savings`.
   - *Sender match*: a fragment of the SMS sender ID, e.g. `HDFCBK`
     (matches senders like `VM-HDFCBK`, `AD-HDFCBK`). This is how incoming
     SMS get linked to the right account.
3. **Settings → Categories** — the 12 defaults (Food & Dining, Groceries,
   Transport, …) are already there; add or delete to taste.
4. **Phone forwarding** — set up Macrodroid (see section 7).

That's it. From now on transactions flow in by themselves.

---

## 3. Daily use: tagging (the only chore)

Open **To Tag** (the nav badge shows how many are waiting):

- Each card shows the merchant, amount (red = spent, green = received),
  date, account, and a collapsible **View original SMS**.
- **Tap one category chip** — that's the whole job. The transaction is tagged
  and the app saves a rule: *this merchant → this category*.
- A chip marked **★** is a suggestion from an existing rule.
- Tagging a merchant also back-fills any *other* untagged transactions from
  the same merchant in one go.

After the first week of tagging your regular merchants, most transactions
arrive already categorized and To Tag stays near-empty.

---

## 4. The dashboard

The home page shows the selected month (←/→ to change):

- **Total Spent** — all debits in the month.
- **Total Received** — all credits (salary, refunds, transfers in).
- **Net** — received minus spent.
- **Spend by Category** — colored bars, biggest first, with percentages.
- A banner appears if transactions are waiting to be tagged.

Numbers include *all* transactions — tagged or not — so totals are always
accurate; untagged ones just show up as "Uncategorized" in the breakdown.

---

## 5. Browsing, fixing, exporting

**Transactions** page:

- Month navigation plus **account filter chips** (All accounts / HDFC / …).
- ✏️ **Edit** any transaction — fix a badly parsed amount, merchant, or date.
  The original SMS is shown on the edit page so you can check against it.
- 🗑️ **Delete** removes a wrong or duplicate record permanently.
- **⬇ Export CSV** downloads the visible month (date, merchant, amount,
  direction, category, account, source, raw SMS) for backup or Excel.

**Add** page — manual entry for anything SMS can't see: cash spends,
reimbursements, wallet payments. Same fields, picks up in all summaries
exactly like SMS transactions.

---

## 6. What happens to each incoming SMS

When your phone forwards an SMS, the webhook decides:

| SMS looks like | What happens |
|---|---|
| Debit alert ("debited", "spent", "paid", "withdrawn"…) | Transaction created as **debit** |
| Credit alert ("credited", "received", "refund"…) | Transaction created as **credit** |
| OTP, promo, offer, "will be debited" reminder, balance-check alert | **Ignored** — nothing is stored |
| Same SMS delivered twice within 10 minutes | **Deduplicated** — stored once |
| Sender matches an account's *sender match* | Transaction linked to that account |
| Merchant matches a learned rule | Auto-categorized, skips To Tag |

The **raw SMS text is always stored** on the transaction. If a bank changes
its format and parsing goes wrong, no data is lost — you can fix the record
by hand (section 5) and the parser can be improved later
(`src/lib/sms-parser.ts`).

---

## 7. Phone setup (Macrodroid, Android)

1. Install **Macrodroid** from the Play Store.
2. Create a macro:
   - **Trigger** → SMS Received → Any content
     (or restrict to your bank sender IDs to save battery).
   - **Action** → HTTP Request:
     - Method: `POST`
     - URL: `https://<your-app>/api/webhook/sms`
       (local testing from the same PC: `http://localhost:3000/api/webhook/sms`)
     - Content type: `application/json`
     - Request body:
       ```json
       {
         "secret": "<your SMS_WEBHOOK_SECRET from .env.local>",
         "message": "[sms_message]",
         "sender": "[sms_name]"
       }
       ```
3. Test: forward yourself a real bank SMS — it should appear in **To Tag**
   within a few seconds. OTPs and promos are silently skipped.

> **Note:** your phone can only reach `localhost` if it's the same machine.
> For real phone → app flow, deploy to Vercel (see README) or expose your
> local server with a tunnel. iOS cannot forward SMS; manual entry is the
> fallback there.

Tasker users: same HTTP Post action with `%SMSRB` (body) and `%SMSRF`
(sender).

---

## 8. How the learning works (merchant rules)

- The first time you tag `swiggy.stores` as *Food & Dining*, a rule
  `swiggy.stores → Food & Dining` is saved.
- Every future SMS whose parsed merchant matches that rule (case-insensitive)
  is categorized on arrival.
- Re-tagging a merchant with a different category **updates** the rule — the
  newest choice wins.
- Rules are per-merchant-name, so `swiggy.stores` and `swiggy.dineout` learn
  independently.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| SMS arrived on phone but no transaction | Macrodroid macro off, wrong URL/secret, or the SMS was classified non-transactional. Check Macrodroid's log; if the SMS is a real transaction, add it manually and consider a parser tweak. |
| Wrong amount/merchant/date | Open the transaction → Edit, fix fields against the shown raw SMS. |
| Duplicate transactions | Bank sent two differently-worded SMS for one payment (e.g. bank + UPI app). Delete one. |
| Transaction not linked to an account | The account's *sender match* fragment doesn't appear in the SMS sender ID. Adjust it in Settings. |
| Login loops back to /login | Session expired or Supabase isn't running (locally: `npx supabase start`). |
| Everything down (local) | Start Docker Desktop, then `npx supabase start`, then `npm run dev`. |

---

## 10. Your data

- Single-user: every table is protected by Supabase Row Level Security —
  only your authenticated user can read or write rows.
- The webhook is protected by a long random secret; rotate it (change
  `SMS_WEBHOOK_SECRET` + update Macrodroid) if you ever suspect it leaked.
- Transactions are kept forever unless you delete them.
- Monthly CSV export (section 5) is your backup.
