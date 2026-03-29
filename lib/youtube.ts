/**
 * YouTube watch / embed / kısa URL'lerden video id çıkarır.
 */
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return embed[1];
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return shorts[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`;
}

export function youtubeThumbnailUrl(
  videoId: string,
  size: "maxresdefault" | "hqdefault" = "maxresdefault"
): string {
  return `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${size}.jpg`;
}
