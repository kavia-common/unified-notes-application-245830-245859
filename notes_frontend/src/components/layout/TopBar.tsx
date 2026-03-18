"use client";

import Link from "next/link";
import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function TopBar() {
  const { user, token, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="container">
        <div className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold tracking-wide">
              Retro Notes
            </Link>
            <span className="badge">
              <span
                aria-hidden="true"
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
              />
              Sync
            </span>
          </div>

          <nav className="flex items-center gap-2">
            {token ? (
              <>
                <Link className="btn" href="/app">
                  Notes
                </Link>
                <button className="btn" type="button" onClick={logout}>
                  Logout
                  <span className="sr-only">{user?.email ? ` (${user.email})` : ""}</span>
                </button>
              </>
            ) : (
              <>
                <Link className="btn" href="/auth/login">
                  Login
                </Link>
                <Link className="btn btn-primary" href="/auth/signup">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
