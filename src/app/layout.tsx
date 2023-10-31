import './globals.css';
import { GeistSans } from 'geist/font';

export const metadata = {
  title: 'Klo 11 lounas',
  description: 'Taikalan lounaslista',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
