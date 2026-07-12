import { redirect } from 'next/navigation';

// Wishlist was merged into the unified Goals page.
export default function WishlistPage() {
  redirect('/goals');
}
