"use client";

import React from "react";

export default function TagsSidebar(props: {
  tags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const { tags, activeTag, onSelectTag, isLoading, error } = props;

  return (
    <aside className="panel p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tags</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Filter notes instantly.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }} aria-live="polite">
            Loading tags…
          </p>
        ) : error ? (
          <p className="text-sm" style={{ color: "var(--danger)" }} role="alert">
            {error}
          </p>
        ) : tags.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No tags yet.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                className={`btn ${activeTag === null ? "btn-primary" : ""}`}
                onClick={() => onSelectTag(null)}
              >
                All
              </button>
            </li>
            {tags.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  className={`btn ${activeTag === t ? "btn-primary" : ""}`}
                  onClick={() => onSelectTag(t)}
                >
                  #{t}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
