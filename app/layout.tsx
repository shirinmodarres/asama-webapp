import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "آساما | سامانه داخلی عملیات",
  description: " پنل داخلی سفارش، انبار، پشتیبانی و فاکتور برای برند آساما",
  icons: {
    icon: [
      {
        url: "/favicon-light.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.ico",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <body className="min-h-full bg-[var(--color-page)] text-[var(--color-foreground)]">
        {children}
      </body>
    </html>
  );
}
