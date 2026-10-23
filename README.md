# Personal Expense Tracker

Automatic expense tracking from bank/UPI SMS alerts. SMS are forwarded from an
Android phone (Macrodroid/Tasker) to a webhook, parsed into transactions, and
categorized with one tap. Built with Next.js (App Router), Supabase, and
deployed on Vercel.

**New here? Read the [User Guide](USER_GUIDE.md)** — how the SMS pipeline,
tagging, and auto-categorization work day to day.

## Features

- **SMS webhook** (`POST /api/webhook/sms`) protected by a shared secret —
  parses amount, debit/credit, merchant, and date from forwarded SMS.
- **Non-transactional SMS filtering** — OTPs, promos, reminders, and balance
  alerts are ignored automatically.
- **One-tap tagging** — untagged transactions show category chips; one tap
  tags the transaction and teaches the app the merchant → category rule.
- **Auto-categorization** — once a merchant is tagged, future SMS from it are
  categorized automatically (the raw SMS is always stored for auditing).
- **Monthly summary** — total spent, total received, net, and a per-category
  breakdown with month navigation.
- **Manual entry** for cash spends, plus edit/delete for any transaction.
- **Accounts** — map SMS sender IDs (e.g. `HDFCBK`) to accounts and filter
  transactions by account.
- **Custom categories** with colors (defaults seeded on signup).
- **CSV export** of any month.
- **Single-user auth** via Supabase Auth; all tables protected by Row Level
  Security.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Go to **Authentication → Users → Add user** and create your login
   (email + password, check "Auto confirm user"). Default categories are
   seeded automatically for the new user.
4. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 2. Local development

```bash
# fill in .env.local with the values above, then:
npm install
npm run dev
```

Open http://localhost:3000 and sign in with the user you created.

### 3. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com](https://vercel.com) → New Project.
3. Add the four environment variables from `.env.local`
   (use a long random `SMS_WEBHOOK_SECRET`, e.g. `openssl rand -hex 32`).
4. Deploy. Your webhook URL is
   `https://<your-app>.vercel.app/api/webhook/sms`.

### 4. Phone-side SMS forwarding (Android, Macrodroid)

1. Install [Macrodroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid).
2. Create a macro:
   - **Trigger:** SMS Received → Any content (or restrict to your bank
     senders).
   - **Action:** HTTP Request →
     - Method: `POST`
     - URL: `https://<your-app>.vercel.app/api/webhook/sms`
     - Content type: `application/json`
     - Body:
       ```json
       {
         "secret": "<your SMS_WEBHOOK_SECRET>",
         "message": "[sms_message]",
         "sender": "[sms_name]"
       }
       ```
3. Send yourself a test: transaction SMS appear in **To Tag** within seconds;
   OTPs and promos are silently ignored.

Tasker works the same way with an HTTP Post action using the `%SMSRB` (body)
and `%SMSRF` (sender) variables.

### 5. In-app setup

- **Settings → Accounts:** add each bank/UPI app with a *sender match*
  fragment (e.g. `HDFCBK`, `SBIUPI`) so incoming SMS are linked to the right
  account.
- **Settings → Categories:** adjust the default category set as you like.

## How tagging works

1. A parsed SMS lands in **To Tag** as an untagged transaction.
2. You tap a category chip. The transaction is tagged and a merchant rule
   (`merchant → category`) is saved.
3. Future transactions from that merchant are auto-tagged on arrival; a ★
   suggestion is shown if a rule exists but wasn't applied.
4. Everything is editable later from **Transactions**.

## Project structure

```
supabase/schema.sql          Database schema, RLS policies, default categories
src/proxy.ts                 Auth session refresh + route protection
src/lib/sms-parser.ts        SMS → transaction parser
src/lib/supabase/            Server/admin Supabase clients
src/app/api/webhook/sms/     SMS ingestion webhook
src/app/api/export/          CSV export
src/app/login/               Sign-in page
src/app/(app)/               Dashboard, To Tag, Transactions, Add, Settings
```

## Extending the SMS parser

Bank formats vary. If an SMS parses wrong (or not at all), the raw SMS is
stored on the transaction (visible in To Tag / Edit), so you can tweak the
patterns in `src/lib/sms-parser.ts` without losing data.
