"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PixelBubble from "./PixelBubble";
import PixelLoader from "./PixelLoader";
import PixelHeart from "./PixelHeart";

type Comment = { id: string; name: string; body: string; at: number };

const MAX_BODY = 1500;
const SPARKS = [
  [-16, -14], [0, -20], [16, -14], [-19, 4], [19, 4], [-9, 16], [9, 16],
] as const;

function keyFor(post: string) {
  return `haristacks-liked:${post}`;
}

function ago(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? "a minute ago" : `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  if (d < 30) return d === 1 ? "yesterday" : `${d} days ago`;
  return new Date(at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PostReactions({ post }: { post: string }) {
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [burst, setBurst] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const honeypot = useRef<HTMLInputElement | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  /* ---- load ---- */

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(keyFor(post)) === "1");
      setAdminToken(localStorage.getItem("haristacks-admin") ?? "");
    } catch {
      // private browsing; the button simply starts unpressed
    }

    let alive = true;
    fetch(`/api/reactions?post=${encodeURIComponent(post)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!alive) return;
        setLikes(typeof data.likes === "number" ? data.likes : 0);
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setOffline(Boolean(data.offline));
      })
      .catch((err) => {
        if (!alive) return;
        console.warn("[reactions] could not load:", err);
        setOffline(true);
        setLikes(0);
        setComments([]);
      });

    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      alive = false;
      clearInterval(tick);
    };
  }, [post]);

  /* ---- like ---- */

  const toggleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, (n ?? 0) + (next ? 1 : -1)));
    if (next) setBurst((b) => b + 1);

    try {
      localStorage.setItem(keyFor(post), next ? "1" : "0");
    } catch {
      // nothing to do; the like still counts on the server
    }

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post, liked: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (typeof data.likes === "number") setLikes(data.likes);
    } catch (err) {
      console.warn("[likes] not saved:", err);
      // put it back the way it was rather than lying about it
      setLiked(!next);
      setLikes((n) => Math.max(0, (n ?? 0) + (next ? -1 : 1)));
      try {
        localStorage.setItem(keyFor(post), next ? "0" : "1");
      } catch {
        /* ignore */
      }
    }
  }, [liked, post]);

  /* ---- comment ---- */

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    const text = body.trim();
    if (text.length < 2) {
      setError("Say something first.");
      return;
    }

    setSending(true);
    setError(null);

    let handle = "";
    try {
      handle = localStorage.getItem("haristacks-handle") ?? "";
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post,
          name: name.trim(),
          body: text,
          handle,
          website: honeypot.current?.value ?? "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "That did not send. Try again.");
        return;
      }

      if (data.comment) {
        const c = data.comment as Comment;
        setComments((list) => [...(list ?? []), c]);
        if (/^maincharacter\(\d+\)$/.test(c.name)) {
          try {
            localStorage.setItem("haristacks-handle", c.name);
          } catch {
            /* ignore */
          }
        }
      }

      setBody("");
      setPosted(true);
      setTimeout(() => setPosted(false), 2600);
    } catch (err) {
      console.warn("[comments] not sent:", err);
      setError("That did not send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function toggleForm() {
    const next = !open;
    setOpen(next);
    setError(null);
    // let the unfold finish before pulling focus, or the page jumps
    if (next) {
      window.setTimeout(() => bodyRef.current?.focus({ preventScroll: true }), 420);
    }
  }

  async function remove(id: string) {
    if (!adminToken) return;
    const before = comments;
    setComments((list) => (list ?? []).filter((c) => c.id !== id));

    try {
      const res = await fetch(
        `/api/comments?post=${encodeURIComponent(post)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE", headers: { "x-admin-token": adminToken } }
      );
      if (!res.ok) throw new Error(String(res.status));
    } catch (err) {
      console.warn("[comments] delete failed:", err);
      setComments(before);
      setError("Could not delete that. Check your token.");
    }
  }

  const count = comments?.length ?? 0;
  const left = MAX_BODY - body.length;

  return (
    <section aria-labelledby="talk-heading" className="wrap-read mt-[var(--band)]">
      <h2 id="talk-heading" className="sr-only">
        Likes and comments
      </h2>

      {/* ---- like ---- */}
      <div className="flex items-center gap-4 border-t border-line pt-9">
        <span className="relative inline-flex">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike this piece" : "Like this piece"}
            disabled={offline}
            className="like-btn disabled:opacity-45"
          >
            <PixelHeart className="heart" size={20} />
            <span className="t-pixel" aria-live="polite">
              {likes === null ? " " : likes}
            </span>
          </button>

          {burst > 0 && !offline ? (
            <span key={burst} className="pointer-events-none absolute inset-0" aria-hidden="true">
              {SPARKS.map(([dx, dy], i) => (
                <i
                  key={i}
                  className="spark"
                  style={
                    {
                      "--dx": `${dx}px`,
                      "--dy": `${dy}px`,
                      animationDelay: `${i * 18}ms`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          ) : null}
        </span>

        <p className="t-pixel text-faint">
          {offline
            ? "reactions are offline"
            : liked
              ? "thanks for that"
              : "if this landed, say so"}
        </p>
      </div>

      {/* ---- thread ---- */}
      <div className="mt-12">
        {comments === null && !offline ? (
          <p className="t-pixel flex items-center text-faint">
            <PixelLoader size={15} label="Loading the thread" />
            <span className="ml-1">reading the room</span>
          </p>
        ) : null}

        {count > 0 ? (
          <p className="t-pixel text-faint">
            {count === 1 ? "1 comment" : `${count} comments`}
          </p>
        ) : null}

        {comments && comments.length > 0 ? (
          <ul className="mt-4">
            {comments.map((c) => (
              <li key={c.id} className="comment">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="t-pixel text-accent-ink">{c.name}</span>
                  <span className="t-pixel text-faint">{ago(c.at, now)}</span>
                </p>
                <p className="comment-body">{c.body}</p>
                {adminToken ? (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="t-pixel mt-3 min-h-11 text-faint underline underline-offset-4 transition-colors duration-200 hover:text-accent-ink"
                  >
                    delete
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {/* ---- the form, folded away until asked for ---- */}
        {offline ? null : (
          <>
            <div className={count > 0 ? "mt-9 border-t border-line pt-9" : "mt-2"}>
              <button
                type="button"
                onClick={toggleForm}
                aria-expanded={open}
                aria-controls="comment-form"
                className="like-btn"
              >
                <PixelBubble size={17} />
                <span className="t-pixel">{open ? "Never mind" : "Comment"}</span>
              </button>
            </div>

            <div
              id="comment-form"
              className={`unfold ${open ? "is-open" : ""}`}
              inert={!open}
            >
              <div>
                <form onSubmit={submit} className="pt-8">
                  <label htmlFor="c-name" className="t-pixel block text-faint">
                    Name — optional
                  </label>
                  <input
                    id="c-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                    autoComplete="name"
                    placeholder="maincharacter?"
                    className="field mt-3"
                  />

                  {/* not visible, not reachable by keyboard, only bots fill it */}
                  <input
                    ref={honeypot}
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="sr-only"
                  />

                  <label htmlFor="c-body" className="t-pixel mt-7 block text-faint">
                    Comment
                  </label>
                  <textarea
                    id="c-body"
                    name="body"
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
                    maxLength={MAX_BODY}
                    required
                    placeholder="What did this make you think about?"
                    className="field mt-3"
                  />

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pb-1">
                    <button type="submit" disabled={sending} className="pill disabled:opacity-50">
                      {sending ? "Sending" : "Post"}
                    </button>
                    <span className="t-pixel text-faint" aria-live="polite">
                      {error ? (
                        <span className="text-accent-ink">{error}</span>
                      ) : posted ? (
                        "posted"
                      ) : left < 200 ? (
                        `${left} left`
                      ) : (
                        ""
                      )}
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
