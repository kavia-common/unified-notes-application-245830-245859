"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import React, { useMemo, useState } from "react";

export default function SignupPage() {
  const { signup, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!canSubmit) {
      setLocalError("Enter a valid email and a password (min 6 chars).");
      return;
    }

    setSubmitting(true);
    try {
      await signup(email.trim(), password);
    } catch {
      // error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <main className="grid place-items-center">
        <section className="panel p-6 w-full max-w-md" aria-label="Sign up form">
          <h1 className="text-2xl font-semibold">Sign up</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Create an account to sync your notes.
          </p>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input mt-1"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input mt-1"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                Minimum 6 characters.
              </p>
            </div>

            {(localError || error) && (
              <p role="alert" className="text-sm" style={{ color: "var(--danger)" }}>
                {localError || error}
              </p>
            )}

            <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Already have an account?{" "}
              <Link className="underline" href="/auth/login">
                Login
              </Link>
            </p>
          </form>
        </section>
      </main>
    </AppShell>
  );
}
