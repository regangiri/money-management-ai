import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Money Manager',
  description: 'Track your money, budgets, savings and investments',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const userName = (user?.user_metadata?.name as string) || undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <Sidebar userName={userName} userEmail={user?.email} />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
