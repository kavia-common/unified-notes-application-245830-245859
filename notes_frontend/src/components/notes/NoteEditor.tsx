"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/notesTypes";
import { parseTagsInput } from "@/lib/notesTypes";

export default function NoteEditor(props: {
  mode: "create" | "edit";
  initial?: Note | null;
  onCancel: () => void;
  onSave: (payload: { title: string; content: string; tags: string[] }) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const { mode, initial, onCancel, onSave, isSaving, error } = props;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setTitle(initial.title ?? "");
    setContent(initial.content ?? "");
    setTagsRaw((initial.tags ?? []).join(", "));
  }, [initial]);

  const isValid = useMemo(() => {
    return title.trim().length > 0 || content.trim().length > 0;
  }, [title, content]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isValid) {
      setLocalError("Add a title or some content before saving.");
      return;
    }

    const tags = parseTagsInput(tagsRaw);
    await onSave({ title: title.trim() || "Untitled", content: content.trim(), tags });
  };

  return (
    <section className="panel p-4 md:p-6" aria-label={mode === "create" ? "Create note" : "Edit note"}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "New note" : "Edit note"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Use commas to separate tags. Example: <span className="kbd">work, ideas</span>
          </p>
        </div>
        <button type="button" className="btn" onClick={onCancel}>
          Close
        </button>
      </header>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="text-sm font-medium" htmlFor="note-title">
            Title
          </label>
          <input
            id="note-title"
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A totally rad idea…"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="note-content">
            Content
          </label>
          <textarea
            id="note-content"
            className="textarea mt-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your note..."
            rows={8}
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="note-tags">
            Tags
          </label>
          <input
            id="note-tags"
            className="input mt-1"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="retro, personal, todo"
            autoComplete="off"
          />
        </div>

        {(localError || error) && (
          <p role="alert" className="text-sm" style={{ color: "var(--danger)" }}>
            {localError || error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button className="btn" type="button" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
