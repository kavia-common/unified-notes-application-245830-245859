import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

export default function Home() {
  return (
    <AppShell>
      <main className="grid gap-6 lg:grid-cols-2 items-start">
        <section className="panel p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Retro Notes.
            <span className="block mt-2" style={{ color: "var(--muted)" }}>
              Fast, searchable, tagged — and synced.
            </span>
          </h1>

          <p className="mt-4 text-base" style={{ color: "var(--muted)" }}>
            Create notes, edit instantly, filter by tags, and search across everything.
            Sign in to keep your notes safe in the cloud.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
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

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="badge">Responsive</span>
            <span className="badge">Accessible</span>
            <span className="badge">Search + Tags</span>
            <span className="badge">Cloud sync (via backend)</span>
          </div>
        </section>

        <section className="panel p-6 md:p-8">
          <h2 className="text-xl font-semibold">Quick tips</h2>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--muted)" }}>
            <li>
              <span className="kbd">Search</span> matches title and content (backend-supported).
            </li>
            <li>
              Add tags like <span className="kbd">work, ideas</span> and filter from the sidebar.
            </li>
            <li>
              If API calls fail, check <span className="kbd">NEXT_PUBLIC_API_BASE</span>.
            </li>
          </ul>
        </section>
      </main>
    </AppShell>
  );
}
