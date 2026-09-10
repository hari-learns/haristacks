import { getState, isConfigured, isKnownPost } from "@/lib/reactions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const post = new URL(request.url).searchParams.get("post") ?? "";

  if (!isKnownPost(post)) {
    return Response.json({ error: "unknown post" }, { status: 404 });
  }

  if (!isConfigured()) {
    // The page still renders; the widget just shows nothing to say yet.
    return Response.json({ likes: 0, comments: [], offline: true });
  }

  try {
    const state = await getState(post);
    return Response.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[reactions] read failed:", err);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
