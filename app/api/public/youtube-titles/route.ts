import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_IDS = 24;
const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

/**
 * POST /api/public/youtube-titles
 * Body: { videoIds: string[] }
 * YouTube oEmbed ile başlık çözümler (cache yok; sayfa yükünde toplu).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { videoIds?: unknown };
    const raw = body.videoIds;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "videoIds gerekli" }, { status: 400 });
    }
    const ids = raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => YT_ID.test(s))
      .slice(0, MAX_IDS);

    const titles: Record<string, string> = {};

    await Promise.all(
      ids.map(async (id) => {
        try {
          const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
          const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
          const r = await fetch(oembed, {
            headers: { Accept: "application/json" },
            next: { revalidate: 3600 },
          });
          if (!r.ok) return;
          const j = (await r.json()) as { title?: string };
          if (typeof j.title === "string" && j.title.length > 0) {
            titles[id] = j.title;
          }
        } catch {
          /* yoksay */
        }
      })
    );

    return NextResponse.json({ titles });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
}
