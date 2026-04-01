"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Geniş tablolar için viewport altına sabitlenen yatay scrollbar.
 *
 * Native scrollbar overflow-x-auto container'ın en altındadır.
 * Bu bileşen, o container'ın alt kenarı viewport dışındayken
 * viewport altına fixed bir kopya koyar ve tabloyla senkronize eder.
 * Kullanıcı yeterince aşağı inip native scrollbar viewport'a girdiğinde
 * kopya otomatik gizlenir.
 */
export function StickyHorizontalScrollbar({
  scrollRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const fakeRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);
  const [nativeBarInView, setNativeBarInView] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  const syncDirection = useRef<"real" | "fake" | null>(null);

  const measureSizes = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sw = el.scrollWidth;
    const cw = el.clientWidth;
    setContentWidth(sw);
    setContainerWidth(cw);
    setHasOverflow(sw > cw + 1);

    const rect = el.getBoundingClientRect();
    setLeftOffset(rect.left);
  }, [scrollRef]);

  useEffect(() => {
    measureSizes();
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => measureSizes());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    window.addEventListener("resize", measureSizes, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureSizes);
    };
  }, [scrollRef, measureSizes]);

  // Sentinel'i scrollRef container'ının EN ALTINA DOM olarak ekle
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const sentinel = document.createElement("div");
    sentinel.style.cssText =
      "height:1px;width:100%;pointer-events:none;flex-shrink:0;";
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.setAttribute("data-sticky-sentinel", "true");
    container.appendChild(sentinel);
    sentinelRef.current = sentinel;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setNativeBarInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
      }
      sentinelRef.current = null;
    };
  }, [scrollRef]);

  // Scroll senkronizasyonu
  useEffect(() => {
    const real = scrollRef.current;
    const fake = fakeRef.current;
    if (!real || !fake) return;

    const onRealScroll = () => {
      if (syncDirection.current === "fake") return;
      syncDirection.current = "real";
      fake.scrollLeft = real.scrollLeft;
      requestAnimationFrame(() => {
        syncDirection.current = null;
      });
    };

    const onFakeScroll = () => {
      if (syncDirection.current === "real") return;
      syncDirection.current = "fake";
      real.scrollLeft = fake.scrollLeft;
      requestAnimationFrame(() => {
        syncDirection.current = null;
      });
    };

    real.addEventListener("scroll", onRealScroll, { passive: true });
    fake.addEventListener("scroll", onFakeScroll, { passive: true });

    fake.scrollLeft = real.scrollLeft;

    return () => {
      real.removeEventListener("scroll", onRealScroll);
      fake.removeEventListener("scroll", onFakeScroll);
    };
  }, [scrollRef]);

  const shouldShow = hasOverflow && !nativeBarInView;

  return (
    <div
      ref={fakeRef}
      className="fixed bottom-0 z-30 overflow-x-auto overflow-y-hidden"
      style={{
        left: leftOffset,
        width: containerWidth || "100%",
        height: 16,
        display: shouldShow ? "block" : "none",
        background:
          "linear-gradient(to top, hsl(var(--background) / 0.85), transparent)",
      }}
    >
      <div
        style={{ width: contentWidth, height: 16, pointerEvents: "none" }}
      />
    </div>
  );
}
