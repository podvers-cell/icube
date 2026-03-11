import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICUBE Media Studio",
  description: "ICUBE Media Studio – Production & Media Solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
