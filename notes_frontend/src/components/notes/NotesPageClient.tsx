"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Note } from "@/lib/notesTypes";
import { createNote, deleteNote, fetchNotes, fetchTags, updateNote } from "@/lib/notesApi";
import NotesList from "@/components/notes/NotesList";
import NoteEditor from "@/components/notes/NoteEditor";
import TagsSidebar from "@/components/notes/TagsSidebar";
import { ApiError } from "@/lib/apiClient";

function mapError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

export default function NotesPageClient() {
  const { token } = useAuth();

  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const [notesLoading, setNotesLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const canQuery = useMemo(() => Boolean(token), [token]);

  const reloadTags = async () => {
    if (!token) return;
    setTagsLoading(true);
    setTagsError(null);
    try {
      const res = await fetchTags({ token });
      setTags(res.tags ?? []);
    } catch (e) {
      setTagsError(mapError(e));
    } finally {
      setTagsLoading(false);
    }
  };

  const reloadNotes = async () => {
    if (!token) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setNotesLoading(true);
    setNotesError(null);
    try {
      const res = await fetchNotes({ token, q: q.trim() || undefined, tag: activeTag ?? undefined });
      setNotes(res.notes ?? []);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setNotesError(mapError(e));
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (!canQuery) return;
    void reloadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery]);

  useEffect(() => {
    if (!canQuery) return;
    void reloadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, activeTag]);

  useEffect(() => {
    if (!canQuery) return;
    const id = window.setTimeout(() => {
      void reloadNotes();
    }, 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, canQuery]);

  const startCreate = () => {
    setEditorMode("create");
    setActiveNote(null);
    setSaveError(null);
    setEditorOpen(true);
  };

  const startEdit = (note: Note) => {
    setEditorMode("edit");
    setActiveNote(note);
    setSaveError(null);
    setEditorOpen(true);
  };

  const requestDelete = async (note: Note) => {
    if (!token) return;
    const ok = window.confirm(`Delete "${note.title}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await deleteNote({ token, id: note.id });
      await reloadNotes();
      await reloadTags();
    } catch (e) {
      setNotesError(mapError(e));
    }
  };

  const save = async (payload: { title: string; content: string; tags: string[] }) => {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editorMode === "create") {
        await createNote({ token, ...payload });
      } else if (activeNote) {
        await updateNote({ token, id: activeNote.id, ...payload });
      }
      setEditorOpen(false);
      await reloadNotes();
      await reloadTags();
    } catch (e) {
      setSaveError(mapError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="grid gap-4 lg:gap-6 lg:grid-cols-[320px_1fr] items-start">
      <div className="space-y-4">
        <section className="panel p-4 md:p-6">
          <h1 className="text-2xl font-semibold">Your notes</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Search, tag, and sync across devices.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <label className="text-sm font-medium label-accent" htmlFor="search">
              Search
            </label>
            <input
              id="search"
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or content…"
              autoComplete="off"
            />
            <div className="flex items-center justify-between gap-2">
              <button className="btn btn-primary" type="button" onClick={startCreate}>
                + New note
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setQ("");
                  setActiveTag(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <TagsSidebar
          tags={tags}
          activeTag={activeTag}
          onSelectTag={(t) => setActiveTag(t)}
          isLoading={tagsLoading}
          error={tagsError}
        />
      </div>

      <div className="space-y-4">
        {editorOpen ? (
          <NoteEditor
            mode={editorMode}
            initial={activeNote}
            onCancel={() => setEditorOpen(false)}
            onSave={save}
            isSaving={saving}
            error={saveError}
          />
        ) : null}

        <NotesList
          notes={notes}
          isLoading={notesLoading}
          error={notesError}
          onEdit={startEdit}
          onDelete={requestDelete}
        />
      </div>
    </main>
  );
}
