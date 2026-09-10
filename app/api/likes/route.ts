import { isConfigured, isKnownPost, setLike } from "@/lib/reactions";
import { callerId, likeLimit } from "@/lib/limits";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }

  let payload: { post?: unknown; liked?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const post = typeof payload.post === "string" ? payload.post : "";
  if (!isKnownPost(post)) {
    return Response.json({ error: "unknown post" }, { status: 404 });
  }

  try {
    const { success } = await likeLimit().limit(callerId(request));
    if (!success) {
      return Response.json({ error: "too many" }, { status: 429 });
    }

    const likes = await setLike(post, payload.liked === true);
    return Response.json({ likes }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[likes] write failed:", err);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
