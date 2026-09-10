import {
  MAX_BODY,
  addComment,
  cleanBody,
  cleanName,
  isConfigured,
  isKnownPost,
  isMintedHandle,
  mintHandle,
  removeComment,
} from "@/lib/reactions";
import { callerId, commentLimit } from "@/lib/limits";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const post = typeof payload.post === "string" ? payload.post : "";
  if (!isKnownPost(post)) {
    return Response.json({ error: "unknown post" }, { status: 404 });
  }

  // a field no person can see, so anything that fills it is not a person
  if (typeof payload.website === "string" && payload.website.length > 0) {
    return Response.json({ ok: true }, { status: 202 });
  }

  const body = cleanBody(payload.body);
  if (body.length < 2) {
    return Response.json({ error: "say something first" }, { status: 400 });
  }
  if (body.length > MAX_BODY) {
    return Response.json({ error: "too long" }, { status: 400 });
  }

  try {
    const { success } = await commentLimit().limit(callerId(request));
    if (!success) {
      return Response.json(
        { error: "You have posted a few already. Try again in a bit." },
        { status: 429 }
      );
    }

    // A typed name wins. Otherwise reuse the handle this browser was given
    // before, or mint a fresh one.
    let name = cleanName(payload.name);
    if (!name) {
      const carried = typeof payload.handle === "string" ? payload.handle : "";
      name = isMintedHandle(carried) ? carried : await mintHandle();
    }

    const comment = await addComment(post, name, body);
    return Response.json(
      { comment },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[comments] write failed:", err);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const secret = process.env.ADMIN_TOKEN;

  // With no token configured, nothing can be deleted over the wire at all.
  if (!secret || !isConfigured()) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  if (request.headers.get("x-admin-token") !== secret) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const post = url.searchParams.get("post") ?? "";
  const id = url.searchParams.get("id") ?? "";

  if (!isKnownPost(post) || !id) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  try {
    await removeComment(post, id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[comments] delete failed:", err);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
