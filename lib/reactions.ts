import "server-only";
import { Redis } from "@upstash/redis";
import { getAllPosts } from "./posts";

/**
 * Likes and comments, kept in Upstash Redis.
 *
 * Deliberately small: a like is a counter, a comment is one JSON string with
 * its id in a sorted set for ordering. No schema, no migrations. If this ever
 * needs real queries it can move to Postgres without the UI changing.
 *
 *   hs:likes:<post>            counter
 *   hs:comments:<post>         sorted set, member = comment id, score = time
 *   hs:comment:<post>:<id>     the comment itself, as JSON
 *   hs:anon                    counter behind the maincharacter(n) handles
 */

export type Comment = {
  id: string;
  name: string;
  body: string;
  at: number;
};

export type PostState = {
  likes: number;
  comments: Comment[];
};

const MAX_BODY = 1500;
const MAX_NAME = 40;
const MAX_COMMENTS = 500;

/** The integration names these differently depending on how it was added. */
function credentials() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL ??
    process.env.REDIS_REST_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function isConfigured() {
  return credentials() !== null;
}

let client: Redis | null = null;

/** Lazy, so a missing key breaks a request rather than the whole build. */
export function redis(): Redis {
  if (!client) {
    const creds = credentials();
    if (!creds) throw new Error("Upstash Redis credentials are not set");
    client = new Redis(creds);
  }
  return client;
}

/** Only ids that match a post that actually exists may become keys. */
export function isKnownPost(post: string): boolean {
  return getAllPosts().some((p) => `${p.category}/${p.slug}` === post);
}

const kLikes = (post: string) => `hs:likes:${post}`;
const kIndex = (post: string) => `hs:comments:${post}`;
const kComment = (post: string, id: string) => `hs:comment:${post}:${id}`;

export async function getState(post: string): Promise<PostState> {
  const r = redis();
  const [likes, ids] = await Promise.all([
    r.get<number>(kLikes(post)),
    r.zrange<string[]>(kIndex(post), 0, MAX_COMMENTS - 1),
  ]);

  if (!ids || ids.length === 0) {
    return { likes: likes ?? 0, comments: [] };
  }

  const raw = await r.mget<(Comment | null)[]>(
    ...ids.map((id) => kComment(post, id))
  );

  const comments = raw
    .filter((c): c is Comment => Boolean(c && c.id && c.body))
    // oldest first reads like a conversation
    .sort((a, b) => a.at - b.at);

  return { likes: likes ?? 0, comments };
}

export async function setLike(post: string, liked: boolean): Promise<number> {
  const r = redis();
  const next = liked
    ? await r.incr(kLikes(post))
    : await r.decr(kLikes(post));

  // a stale client should never drive the count below zero
  if (next < 0) {
    await r.set(kLikes(post), 0);
    return 0;
  }
  return next;
}

/** maincharacter(1), maincharacter(2), … for anyone who leaves the name blank. */
export async function mintHandle(): Promise<string> {
  const n = await redis().incr("hs:anon");
  return `maincharacter(${n})`;
}

export function isMintedHandle(value: string): boolean {
  return /^maincharacter\(\d+\)$/.test(value);
}

export function cleanName(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

export function cleanBody(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_BODY);
}

export async function addComment(
  post: string,
  name: string,
  body: string
): Promise<Comment> {
  const r = redis();
  const comment: Comment = {
    id: crypto.randomUUID().slice(0, 12),
    name,
    body,
    at: Date.now(),
  };

  await Promise.all([
    r.set(kComment(post, comment.id), comment),
    r.zadd(kIndex(post), { score: comment.at, member: comment.id }),
  ]);

  return comment;
}

export async function removeComment(post: string, id: string): Promise<void> {
  const r = redis();
  await Promise.all([r.del(kComment(post, id)), r.zrem(kIndex(post), id)]);
}

export { MAX_BODY, MAX_NAME };
