import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "Retro Notes",
  description: "A retro-themed notes app with tags, search, and cloud sync.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="app-shell">
            <TopBar />
            <div className="container py-6">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
