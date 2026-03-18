import AppShell from "@/components/layout/AppShell";
import NotesPageClient from "@/components/notes/NotesPageClient";

export default function AppPage() {
  return (
    <AppShell>
      <NotesPageClient />
    </AppShell>
  );
}
