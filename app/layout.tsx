import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suflate - Voice-First LinkedIn Content Creation",
  description: "Turn how you think into LinkedIn posts — using your voice",
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
