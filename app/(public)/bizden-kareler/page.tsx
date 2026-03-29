import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTenantBranding } from "@/lib/tenant-branding";
import { parseYoutubeVideoId } from "@/lib/youtube";

import { ELYA_GALLERY_VIDEOS } from "@/lib/elya-gallery-videos";

import { BizdenKarelerClient } from "./bizden-kareler-client";

const ELYA_SLUG = "elya-hayvancilik";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding();
  if (branding.logo_slug !== ELYA_SLUG) {
    return { title: "Sayfa bulunamadı" };
  }
  return {
    title: "Bizden Kareler | Elya Hayvancılık",
    description:
      "Elya Hayvancılık kurban organizasyonundan fotoğraf ve video kareleri.",
  };
}

export default async function BizdenKarelerPage() {
  const branding = await getTenantBranding();
  if (branding.logo_slug !== ELYA_SLUG) {
    notFound();
  }

  const items = ELYA_GALLERY_VIDEOS.map((v) => {
    const videoId = parseYoutubeVideoId(v.youtubeUrl);
    if (!videoId) {
      throw new Error(`Geçersiz YouTube URL: ${v.youtubeUrl}`);
    }
    return { title: v.title, videoId };
  });

  return <BizdenKarelerClient items={items} />;
}
