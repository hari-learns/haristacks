"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "haristacks-admin";

/**
 * Not a login. It stores your moderation token in this browser so delete
 * controls appear on comments. The token is only ever checked on the server.
 */
export default function AdminPage() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(KEY);
      if (existing) {
        setToken(existing);
        setSaved(true);
      }
    } catch {
      /* private browsing */
    }
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (token.trim()) {
        localStorage.setItem(KEY, token.trim());
        setSaved(true);
      } else {
        localStorage.removeItem(KEY);
        setSaved(false);
      }
    } catch {
      /* private browsing */
    }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* private browsing */
    }
    setToken("");
    setSaved(false);
  }

  return (
    <main id="main" className="wrap-read flex-1 py-24">
      <p className="t-pixel text-faint">Moderation</p>
      <h1 className="t-title mt-4">Delete comments</h1>
      <p className="t-lede mt-4">
        Paste your token. Delete buttons then appear under every comment, on this
        browser only.
      </p>

      <form onSubmit={save} className="mt-10">
        <label htmlFor="token" className="t-pixel block text-faint">
          Token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="field mt-3"
          placeholder="from ADMIN_TOKEN"
        />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" className="pill">
            Save
          </button>
          {saved ? (
            <button
              type="button"
              onClick={clear}
              className="t-pixel min-h-11 text-muted underline underline-offset-4"
            >
              Forget it
            </button>
          ) : null}
          <span className="t-pixel text-faint" aria-live="polite">
            {saved ? "moderation on" : ""}
          </span>
        </div>
      </form>

      <p className="t-pixel mt-14">
        <Link href="/" className="text-muted underline underline-offset-4">
          Back home
        </Link>
      </p>
    </main>
  );
}
