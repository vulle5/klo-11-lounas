import "./globals.css";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Klo 11 lounas",
  description: "Taikalan lounaslista",
};

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
