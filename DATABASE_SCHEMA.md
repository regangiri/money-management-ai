# Database Schema

## Overview

The app uses Supabase (PostgreSQL) to store transactions and budgets. This document describes the schema, relationships, and how to set it up.

## Tables

### `transactions`

Stores all income and expense entries.

| Column       | Type          | Description                                           |
| ------------ | ------------- | ----------------------------------------------------- |
| `id`         | UUID          | Primary key, auto-generated                           |
| `user_id`    | TEXT          | User identifier (currently hardcoded as `'user-1'`)   |
| `name`       | TEXT          | Transaction description (e.g., "Coffee", "Salary")    |
| `category`   | TEXT          | Category type (e.g., "Food & Drink", "Income")        |
| `amount`     | DECIMAL(10,2) | Amount in USD (positive = income, negative = expense) |
| `date`       | DATE          | Transaction date (ISO 8601 format)                    |
| `pocket_id`  | UUID          | Pocket the money moved through (nullable)             |
| `created_at` | TIMESTAMP     | Record creation timestamp (auto-set)                  |

**Constraints:**

- `amount != 0` — No zero-value transactions
- Indexed on `(user_id, date DESC)` for fast queries
- Indexed on `(user_id, category)` for category filtering

**Example Rows:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-1",
  "name": "Morning Coffee",
  "category": "Food & Drink",
  "amount": -6.5,
  "date": "2026-06-17",
  "created_at": "2026-06-17T09:30:45Z"
}
```

### `budgets`

Stores budget limits by category.

| Column       | Type          | Description                                         |
| ------------ | ------------- | --------------------------------------------------- |
| `id`         | UUID          | Primary key, auto-generated                         |
| `user_id`    | TEXT          | User identifier (currently hardcoded as `'user-1'`) |
| `category`   | TEXT          | Budget category (e.g., "Groceries", "Dining Out")   |
| `total`      | DECIMAL(10,2) | Budget limit in USD                                 |
| `created_at` | TIMESTAMP     | Record creation timestamp (auto-set)                |

**Constraints:**

- `UNIQUE(user_id, category)` — One budget per category per user
- `total > 0` — Budget amounts must be positive
- Indexed on `user_id` for fast lookups

**Example Rows:**

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "user-1",
  "category": "Groceries",
  "total": 400.0,
  "created_at": "2026-06-01T10:00:00Z"
}
```

### `pockets`

Where the money actually sits: e-money cards, bank accounts, cash, or anything
custom. A transaction names the pocket it was paid from (expense/savings) or
received into (income).

| Column            | Type          | Description                                           |
| ----------------- | ------------- | ----------------------------------------------------- |
| `id`              | UUID          | Primary key, auto-generated                           |
| `user_id`         | TEXT          | Owning auth user                                      |
| `name`            | TEXT          | Pocket name (e.g., "Flazz", "BCA Main")               |
| `type`            | TEXT          | `emoney` \| `bank` \| `cash` \| `custom`              |
| `issuer`          | TEXT          | Who issues/holds it (e.g., "BCA Flazz"), nullable     |
| `opening_balance` | DECIMAL(14,2) | Balance before any tracked transaction                |
| `archived`        | BOOLEAN       | Hidden from pickers when true                         |
| `created_at`      | TIMESTAMP     | Record creation timestamp (auto-set)                  |

**Constraints:**

- `type IN ('emoney', 'bank', 'cash', 'custom')`
- `UNIQUE(user_id, name)` — one pocket per name per user
- `transactions.pocket_id` references it `ON DELETE SET NULL`, so deleting a
  pocket keeps its transactions (they just stop being attributed to a pocket)
- Indexed on `user_id`; `transactions` indexed on `pocket_id`

## Computed Values

The app computes the following values on-the-fly (NOT stored in the database):

### `spent` (for budgets)

```sql
SELECT SUM(ABS(amount))
FROM transactions
WHERE user_id = 'user-1'
  AND category = 'Groceries'
  AND amount < 0  -- expenses only
```

This ensures real-time accuracy without storing duplicate data. Note that
`spent` deliberately ignores `pocket_id`: a budget counts every expense in its
category, whichever pocket paid for it.

### `balance` (for pockets)

```sql
SELECT p.opening_balance + COALESCE(SUM(t.amount), 0)
FROM pockets p
LEFT JOIN transactions t ON t.pocket_id = p.id
WHERE p.user_id = auth.uid()::text
GROUP BY p.id
```

Income is stored positive and expenses/savings negative, so the running sum is
the balance. The app computes this in `withBalances()` (`src/lib/pockets.ts`).

### `budget_utilization` (percentage)

```
(spent / total) * 100
```

Used to render progress bars and warning states.

## Row-Level Security (RLS)

All tables have RLS enabled with policies:

### `transactions` Policies

- `SELECT`: Users see only their own transactions
- `INSERT`: Users can only insert transactions for themselves
- `DELETE`: Users can delete only their own transactions
- `UPDATE`: Not allowed (transactions are immutable; delete and re-add to correct)

### `budgets` Policies

- `SELECT`: Users see only their own budgets
- `INSERT`: Users can only insert budgets for themselves
- `UPDATE`: Users can update only their own budgets (to change the limit)
- `DELETE`: Users can delete only their own budgets

**Current Implementation:**

- RLS policies check `user_id = current_user_id()`
- For now, hardcoded `'user-1'` (mock user)
- When real auth is added, `current_user_id()` will return the logged-in user

## Indexes

Created for performance:

| Index                        | Columns                | Purpose                           |
| ---------------------------- | ---------------------- | --------------------------------- |
| `idx_transactions_user_date` | `(user_id, date DESC)` | Fetch recent transactions quickly |
| `idx_transactions_category`  | `(user_id, category)`  | Filter transactions by category   |
| `idx_budgets_user`           | `(user_id)`            | Fetch all budgets for a user      |

## Backup & Migration

### Export Data

```bash
# Supabase CLI (if installed)
supabase db pull

# Or use Supabase dashboard: Database → Backups
```

### Restore from Backup

```bash
# Via Supabase dashboard: Settings → Backups → Restore
# Or run SQL migration again:
# SQL Editor → supabase/migrations/001_init.sql
```

## Queries Used in the App

### Fetch all transactions for a user

```typescript
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: false });
```

### Add a transaction

```typescript
const { data } = await supabase
  .from('transactions')
  .insert([
    {
      user_id: userId,
      name: 'Coffee',
      category: 'Food & Drink',
      amount: -6.5,
      date: '2026-06-17',
    },
  ])
  .select();
```

### Fetch budgets with computed `spent`

```typescript
// Get budgets
const { data: budgets } = await supabase
  .from('budgets')
  .select('*')
  .eq('user_id', userId);

// Compute spent from transactions
const { data: transactions } = await supabase
  .from('transactions')
  .select('category, amount')
  .eq('user_id', userId);

// Aggregate by category
const spentByCategory = transactions.reduce((acc, t) => {
  if (t.amount < 0) {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
  }
  return acc;
}, {});

// Attach spent to budgets
const budgetsWithSpent = budgets.map((b) => ({
  ...b,
  spent: spentByCategory[b.category] || 0,
}));
```

### Upsert a budget (create or update)

```typescript
const { data } = await supabase
  .from('budgets')
  .upsert(
    [
      {
        user_id: userId,
        category: 'Groceries',
        total: 400.0,
      },
    ],
    {
      onConflict: 'user_id,category',
    },
  )
  .select();
```

## Categories

Currently supported transaction/budget categories:

- **Income**
- **Shopping**
- **Food & Drink**
- **Utilities**
- **Transport**
- **Health**
- **Entertainment**

Users can create custom budget categories beyond this list.

## Limitations & Future Improvements

### Current Limitations

- Mock user ID (`'user-1'`) hardcoded — no multi-user support
- Transactions are immutable (no edit)
- No soft deletes — deletions are permanent
- No audit log — can't see who changed what

### Future Enhancements

1. **Real User Authentication**
   - Replace hardcoded `'user-1'` with Supabase Auth
   - Each user gets isolated data via RLS

2. **Audit Log**
   - Add `audit_log` table to track all changes
   - Useful for debugging and compliance

3. **Recurring Transactions**
   - Add `recurring` and `frequency` columns
   - Auto-generate transactions weekly/monthly

4. **Tags**
   - Allow multiple tags per transaction
   - More flexible categorization

5. **Attachments**
   - Store receipts (images, PDFs) in Supabase Storage
   - Link to transactions

6. **Real-time Sync**
   - Supabase Realtime subscriptions
   - See updates immediately on all devices

## Troubleshooting

### "permission denied for schema public"

**Cause:** RLS policies not created properly.

**Fix:** Re-run the migration SQL:

1. Supabase dashboard → SQL Editor
2. Paste `supabase/migrations/001_init.sql`
3. Click Run

### "Duplicate key value violates unique constraint"

**Cause:** Trying to create two budgets for the same category.

**Fix:** Either delete the old budget first or use UPSERT (which the app does automatically).

### "Invalid date format"

**Cause:** Date not in ISO 8601 format (YYYY-MM-DD).

**Fix:** Ensure dates are formatted as `'2026-06-17'` before inserting.

## Database Size Estimates

For reference, typical database sizes:

- **1 year of daily transactions** (~365 rows): ~50 KB
- **12 months of budgets** (~12 rows): ~2 KB
- **100 years of data**: ~5 MB

Supabase free tier includes 500 MB storage, so you're well within limits.

---

**For Supabase setup instructions, see `SUPABASE_SETUP.md`.**
