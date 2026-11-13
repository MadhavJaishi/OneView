import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OneView | Privacy-Preserving Asset Distribution & Stealth Proxy',
  description: 'Next-Generation, Privacy-Preserving Asset Distribution & Stealth Live Web Proxy Architecture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
