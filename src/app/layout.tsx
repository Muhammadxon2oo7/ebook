import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Oziq-ovqat Xavfsizligini Ta\'minlash eBook',
  description: 'Oziq-ovqat xavfsizligi bo\'yicha elektron kitob',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}