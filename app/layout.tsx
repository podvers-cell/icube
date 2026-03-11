import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./ClientProviders";

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
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
