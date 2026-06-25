# Money Management App — Supabase Integration Guide

This app now supports real data storage with Supabase! Follow these steps to set up your database and start managing transactions and budgets.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supabase Setup](#supabase-setup)
3. [Environment Variables](#environment-variables)
4. [Features](#features)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Without Supabase (Local Development)

The app works perfectly fine without Supabase—it uses mock data. This is great for development or demos:

```bash
pnpm install
pnpm dev
```

Then visit http://localhost:3000 and explore with sample data.

### With Supabase (Production-Ready)

Want to save your data? Follow the steps below.

---

## Supabase Setup

### 1. Create a Supabase Project

- Go to [https://supabase.com](https://supabase.com)
- Click **"New Project"** (or sign up if needed)
- Fill in:
  - **Project name**: e.g., `money-management`
  - **Database password**: Choose a strong password (you'll need this)
  - **Region**: Pick the closest to you (e.g., `us-east-1`)
- Click **"Create new project"**
- Wait 2–3 minutes for your database to initialize

### 2. Run the Database Migration

Once your Supabase project is ready:

1. In the Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `supabase/migrations/001_init.sql` in your code editor
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (top right)
7. Wait for success ✓

This creates:

- `transactions` table — stores all your income/expenses
- `budgets` table — stores your budget limits
- Indexes — for fast lookups
- Row-level security (RLS) policies — keeps your data private

### 3. Get Your API Credentials

- In Supabase dashboard, go to **Settings** → **API** (bottom left)
- Copy these two values:
  - **Project URL** (looks like `https://xxxxxxxxxxxxx.supabase.co`)
  - **anon public** key (under "Project API keys")

### 4. Create `.env.local` File

In the **root** of your project (same level as `package.json`), create a file named `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsY...
```

Replace the values with your credentials from step 3.

**Important:**

- `.env.local` is listed in `.gitignore` — it's never committed (safe for secrets)
- Only these two variables start with `NEXT_PUBLIC_` (publicly visible in the browser)

### 5. Restart the Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then start it again
pnpm dev
```

You should see no warnings about missing credentials. ✓

### 6. Test It Out

1. Go to http://localhost:3000
2. Click **"Add Transaction"** button (top right)
3. Fill in the form:
   - Date: Today (or any date)
   - Type: Expense
   - Description: "Coffee"
   - Category: "Food & Drink"
   - Amount: 5.50
4. Click **"Add Transaction"**
5. The modal closes and your transaction appears in the list ✓

Repeat with budgets:

1. Go to http://localhost:3000/budgets
2. Click **"New Budget"** button
3. Fill in:
   - Category: "Coffee Runs" (or pick a predefined one)
   - Amount: 100
4. Click **"Add Budget"** ✓

---

## Environment Variables

### What Each Variable Does

**`NEXT_PUBLIC_SUPABASE_URL`**

- Your Supabase project's database endpoint
- `NEXT_PUBLIC_` means it's sent to the browser (it's safe—only for read-only access)

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**

- Anonymous API key for public read/write access
- Row-level security (RLS) policies restrict what users can access
- Current setup: Uses a mock user ID `'user-1'` (all data for one user)

### Local Development (`.env.local`)

Create this file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Production Deployment (Vercel, Netlify, etc.)

Set these as environment variables in your hosting platform's dashboard:

**Vercel Example:**

1. Go to your project settings
2. Scroll to "Environment Variables"
3. Add two variables with the same names as above
4. Redeploy

---

## Features

### Current Capabilities

- ✅ **Add transactions** with date, category, amount, type (income/expense)
- ✅ **Create budgets** with custom or predefined categories
- ✅ **View spending by category** on the Reports page
- ✅ **Track budget usage** — see what you're spending vs. your limit
- ✅ **Works offline** — falls back to mock data if Supabase is down

### Under the Hood

**Transactions Table**

```sql
id (UUID)           — Unique identifier
user_id (TEXT)      — Currently hardcoded as 'user-1'
name (TEXT)         — Description (e.g., "Morning Coffee")
category (TEXT)     — Type (Income, Shopping, Food & Drink, etc.)
amount (DECIMAL)    — Positive for income, negative for expenses
date (DATE)         — Transaction date
created_at (TIMESTAMP) — Auto-generated timestamp
```

**Budgets Table**

```sql
id (UUID)           — Unique identifier
user_id (TEXT)      — Currently hardcoded as 'user-1'
category (TEXT)     — Budget category
total (DECIMAL)     — Budget limit
created_at (TIMESTAMP) — Auto-generated timestamp
```

**Spent Amount**

- NOT stored in the database
- Calculated on-the-fly by summing all expenses in each category
- This ensures real-time accuracy

---

## Testing

### End-to-End Flow

1. **Add a transaction:**

   ```
   Dashboard → "Add Transaction" → Fill form → Submit
   → See it in Recent Transactions list
   → Check Reports for updated category breakdown
   ```

2. **Add a budget:**

   ```
   Budgets page → "New Budget" → Fill form → Submit
   → See it in the budget grid
   → Reports page shows budget vs. actual spending
   ```

3. **Verify data persists:**
   ```
   Refresh the page (Cmd+R) → Your data is still there
   → It's in Supabase!
   ```

### Fallback to Mock Data

If Supabase credentials are missing:

```bash
# Remove or comment out from .env.local
# Then restart dev server
pnpm dev
```

The app gracefully falls back to mock data. Perfect for demos or if Supabase goes down.

---

## Troubleshooting

### "Error: Supabase not configured"

**Symptom:** Can't add transactions/budgets; form submission fails.

**Fix:**

1. Check `.env.local` exists in project root
2. Verify both variables are set (copy-paste from Supabase dashboard)
3. Restart dev server: `pnpm dev`
4. Check browser console (F12 → Console) for error messages

### "Error: Permission denied"

**Symptom:** Form submission fails with a permissions error.

**Fix:**

1. Go to Supabase dashboard → SQL Editor
2. Re-run the migration SQL (copy-paste from `supabase/migrations/001_init.sql`)
3. Check that RLS policies are created (no errors during run)

### "Error: supabaseUrl is required"

**Symptom:** Build fails; error mentions Supabase URL.

**Fix:**

1. This is normal during `pnpm build` if `.env.local` is missing
2. For production builds, add env vars to your hosting platform (Vercel, Netlify, etc.)
3. For local: Create `.env.local` and restart

### "My transactions/budgets aren't saving"

**Symptom:** Form appears to succeed, but data doesn't persist after refresh.

**Fix:**

1. Check browser Network tab (F12 → Network):
   - Click "Add Transaction"
   - Look for POST request to `/api/transactions`
   - Check response status (should be 201)
2. If status is 500 or error response shows: Check Supabase logs
3. If status is 400 (bad request): Check form fields are filled in correctly

### "Changes aren't showing immediately"

**Symptom:** After adding a transaction, the list doesn't update.

**Fix:**

1. Refresh the page (Cmd+R / Ctrl+R)
2. The app uses cache for performance
3. Cache refreshes automatically after form submission
4. In the future, we can add real-time sync with Supabase subscriptions

---

## Next Steps

### Future Enhancements

1. **User Authentication**
   - Replace hardcoded `'user-1'` with real user auth
   - Each user gets their own data

2. **Real-Time Updates**
   - Add Supabase Realtime subscriptions
   - See other users' budgets update live

3. **Advanced Filters**
   - Filter transactions by date range
   - Search by keyword

4. **Data Export**
   - Export transactions as CSV
   - Generate PDF reports

5. **Mobile App**
   - React Native version using same Supabase backend

---

## Support

If you hit issues:

1. **Check the error message** — usually tells you what's wrong
2. **Review the setup guide above** — 90% of issues are missing/wrong env vars
3. **Supabase docs:** https://supabase.com/docs
4. **Next.js docs:** https://nextjs.org/docs

---

**Happy budgeting! 💰**
