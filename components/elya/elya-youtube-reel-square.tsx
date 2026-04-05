"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

const THUMB_ORDER = ["maxresdefault", "sddefault", "hqdefault"] as const;

function thumbUrl(videoId: string, i: number) {
  const size = THUMB_ORDER[Math.min(i, THUMB_ORDER.length - 1)];
  return `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${size}.jpg`;
}

/**
 * Kare önizleme (üst/alt kırpma: object-cover) + altta üst üste duran «İzle».
 */
export function ElyaYoutubeReelSquare({
  videoId,
  title,
  onPlay,
  className,
  imageSizes = "200px",
}: {
  videoId: string;
  title: string;
  onPlay: () => void;
  className?: string;
  imageSizes?: string;
}) {
  const [thumbStep, setThumbStep] = useState(0);
  const thumbSrc = thumbUrl(videoId, thumbStep);

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-sm border border-border/60 bg-card transition-transform duration-300 hover:scale-[1.04]",
        className
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`${title} önizlemesini aç`}
        className="absolute inset-0 overflow-hidden p-0 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Image
          src={thumbSrc}
          alt=""
          fill
          className="object-cover object-center scale-[1.85]"
          sizes={imageSizes}
          onError={() =>
            setThumbStep((s) =>
              s < THUMB_ORDER.length - 1 ? s + 1 : s
            )
          }
        />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className="absolute bottom-0 left-1/2 z-10 w-fit -translate-x-1/2 rounded-sm bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:px-3 sm:text-sm"
      >
        İzle
      </button>
    </div>
  );
}
