import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jeremia Frederik — meetstabl.com",
  description: "Jeremia Frederik, sound engineer and builder of meetstabl.com — a finance tracker with built-in AI to prevent overspending.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
