"use client";

import React from "react";
import type { Note } from "@/lib/notesTypes";

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function NotesList(props: {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  const { notes, isLoading, error, onEdit, onDelete } = props;

  if (isLoading) {
    return (
      <section className="panel p-4 md:p-6" aria-live="polite">
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Loading notes…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel p-4 md:p-6" role="alert">
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      </section>
    );
  }

  if (notes.length === 0) {
    return (
      <section className="panel p-4 md:p-6" aria-live="polite">
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          No notes yet. Create one to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-4 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="text-sm meta">
          {notes.length} total
        </p>
      </header>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <li key={n.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="text-left"
                onClick={() => onEdit(n)}
                aria-label={`Edit note ${n.title}`}
              >
                <h3 className="font-semibold">{n.title}</h3>
                <p className="mt-1 text-sm line-clamp-3" style={{ color: "var(--muted)" }}>
                  {n.content || "—"}
                </p>
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(n)}
                aria-label={`Delete note ${n.title}`}
                title="Delete note"
              >
                Delete
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(n.tags ?? []).slice(0, 6).map((t) => (
                <span className="badge" key={t}>
                  #{t}
                </span>
              ))}
              {(n.tags ?? []).length > 6 ? (
                <span className="badge">+{(n.tags ?? []).length - 6}</span>
              ) : null}
            </div>

            <p className="mt-3 text-xs meta">
              {formatTime(n.updatedAt || n.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
