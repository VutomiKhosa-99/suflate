import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ServiceWorkerRegistration } from "@/components/features/notifications/service-worker-registration";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
