import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <AppShell>
      <main className="grid place-items-center">
        <section className="panel p-6 w-full max-w-lg" role="alert" aria-live="assertive">
          <h1 className="text-2xl font-semibold">404 – Page Not Found</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            The page you’re looking for doesn’t exist.
          </p>
          <div className="mt-4">
            <Link className="btn btn-primary" href="/">
              Go home
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
