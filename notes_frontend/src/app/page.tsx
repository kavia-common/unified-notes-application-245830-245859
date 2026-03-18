import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

export default function Home() {
  return (
    <AppShell>
      <main className="grid gap-6 lg:grid-cols-2 items-start">
        <section className="panel p-6 md:p-10">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-10 h-10 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                boxShadow: "0 18px 50px rgba(59,130,246,0.20)",
              }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                Notes that stay in sync
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Retro Notes
              </h1>
            </div>
          </div>

          <p className="mt-5 text-base" style={{ color: "var(--muted)" }}>
            Create notes, edit instantly, filter by tags, and search across everything.
            Sign in to keep your notes safe in the cloud and accessible on any device.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/app" className="btn btn-primary">
              Open app
            </Link>
            <Link href="/auth/login" className="btn">
              Login
            </Link>
            <Link href="/auth/signup" className="btn">
              Sign up
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="badge">Responsive</span>
            <span className="badge">Accessible</span>
            <span className="badge">Search + Tags</span>
            <span className="badge">Cloud sync</span>
          </div>
        </section>

        <section className="panel p-6 md:p-10">
          <h2 className="text-xl font-semibold">Quick tips</h2>

          <div className="mt-4 grid gap-3">
            <div className="card p-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                <span className="kbd">Search</span> matches title and content (backend-supported).
              </p>
            </div>

            <div className="card p-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Add tags like <span className="kbd">work, ideas</span> and filter from the sidebar.
              </p>
            </div>

            <div className="card p-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                If API calls fail, check <span className="kbd">NEXT_PUBLIC_API_BASE</span>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
