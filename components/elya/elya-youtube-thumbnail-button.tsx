"use client";

import Image from "next/image";
import { useState } from "react";

import { youtubeThumbnailUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export function ElyaYoutubeThumbnailButton({
  videoId,
  title,
  onClick,
  className,
  aspectClassName = "aspect-[4/3]",
  hideCaption = false,
  imageSizes = "(max-width: 768px) 100vw, 50vw",
}: {
  videoId: string;
  title: string;
  onClick: () => void;
  className?: string;
  /** Thumbnail kutusu en-boy oranı */
  aspectClassName?: string;
  /** Kart düzeninde başlık altta metin olarak gösterilecekse true */
  hideCaption?: boolean;
  imageSizes?: string;
}) {
  const [thumbSize, setThumbSize] = useState<"maxresdefault" | "hqdefault">("maxresdefault");
  const thumbSrc = youtubeThumbnailUrl(videoId, thumbSize);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} videosunu oynat`}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl text-left shadow-md outline-none ring-offset-background transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className={cn("relative w-full", aspectClassName)}>
        <Image
          src={thumbSrc}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          sizes={imageSizes}
          onError={() => setThumbSize("hqdefault")}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-[3px] transition duration-300 group-hover:scale-110 group-hover:bg-white/30"
            aria-hidden
          >
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-9 w-9 text-white drop-shadow"
              fill="currentColor"
              aria-hidden
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        {!hideCaption ? (
          <p className="absolute bottom-0 left-0 right-0 px-4 pb-5 text-center font-serif text-xs font-medium uppercase tracking-[0.12em] text-white drop-shadow md:text-sm">
            {title}
          </p>
        ) : null}
      </div>
    </button>
  );
}
