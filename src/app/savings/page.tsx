import { redirect } from 'next/navigation';

// Savings was merged into the unified Goals page.
export default function SavingsPage() {
  redirect('/goals');
}
