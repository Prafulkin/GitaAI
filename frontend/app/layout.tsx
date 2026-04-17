import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gita AI",
  description: "Local Bhagavad Gita guidance using the Bhagavad Gita.",
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
