"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Heart, Quote, Star } from "lucide-react";

import { ElyaYoutubeReelSquare } from "@/components/elya/elya-youtube-reel-square";
import { ElyaYoutubeThumbnailButton } from "@/components/elya/elya-youtube-thumbnail-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { BIZDEN_KARELER_VIDEOS } from "@/lib/bizden-kareler-videos";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/** Önceki Hakkımızda sayfasındaki Elya metinleri — eksiksiz. */
const ELYA_ABOUT_FULL_PARAGRAPHS = [
  "Kurban hizmetleri alanında güven, şeffaflık ve kaliteyi esas alan bir anlayışla faaliyet gösteriyoruz. Amacımız; kurban ibadetini, hem dini hassasiyetlere uygun hem de modern hizmet standartlarıyla buluşturarak en doğru şekilde yerine getirilmesini sağlamaktır.",
  "Uzun yıllardır sektörde edinilmiş tecrübe ile güçlü altyapıyı bir araya getirerek, sürecin her aşamasını planlı, düzenli ve güvenilir bir şekilde yürütüyoruz. Bölgesinde örnek gösterilen modern tesisimiz ve disiplinli çalışma sistemimizle, hizmet kalitemizi her geçen gün daha ileriye taşıyoruz.",
  "Geçtiğimiz yıllarda elde ettiğimiz tecrübe ve müşteri memnuniyetinin verdiği güçle, her geçen yıl hizmet kapasitemizi artırıyor; bu yıl itibarıyla organizasyonumuzu büyüterek kapasitemizi iki katına çıkarıyoruz.",
  "Amacımız; kurban ibadetinin güven içinde, huzurla ve usulüne uygun şekilde yerine getirilmesine vesile olmaktır.",
  "Modern tesisimiz, tecrübeli ekibimiz ve dürüst hizmet anlayışımızla her yıl daha fazla aileye güvenilir kurban hizmeti sunmayı hedefliyoruz.",
] as const;

const TESTIMONIALS = [
  {
    quoteTitle: "Gönül rahatlığıyla hisse aldık",
    body: "Organizasyonun şeffaflığı ve iletişimi sayesinde süreci adım adım takip ettik. Teslimat ve bilgilendirme konusunda hiçbir belirsizlik yaşamadık.",
    name: "Ayşe K.",
    role: "Hissedar",
  },
  {
    quoteTitle: "Profesyonel bir ekip",
    body: "Kesim ve paylaştırma aşamalarında gösterilen özen ve düzen bizi çok memnun etti. Teşekkürler.",
    name: "Mehmet Y.",
    role: "Hissedar",
  },
  {
    quoteTitle: "Güvenilir adres",
    body: "Yıllardır ailecek Elya üzerinden kurban ibadetimizi yerine getiriyoruz; tavsiye ederim.",
    name: "Fatma S.",
    role: "Hissedar",
  },
  {
    quoteTitle: "Her şey planlı ve net",
    body: "Kapora ve ödeme süreçleri netti; kesim günü öncesi bilgilendirme yeterliydi. Memnun kaldık.",
    name: "Hasan T.",
    role: "Hissedar",
  },
  {
    quoteTitle: "Tesiste gözümüz aydınlandı",
    body: "Yerinde inceleme imkânı verilmesi güvenimizi artırdı. Ekibin ilgisi ve düzeni için teşekkürler.",
    name: "Zeynep A.",
    role: "Hissedar",
  },
] as const;

/** Masaüstü: aynı anda görünen kısa video (oklar tek adım kaydırır) */
const SHORTS_VISIBLE_DESKTOP = 5;
/** Mobil: aynı anda görünen kısa video */
const SHORTS_VISIBLE_MOBILE = 2;
const REEL_GAP_PX = 12;
/** Bizden Kareler video bloğu — sabit maksimum genişlik */
const BIZDEN_KARELER_MAX_W = "max-w-[1320px]";

/** Header ile aynı yatay hizalama (`header` → `container`) */
const contentCol = "container";

const TESTIMONIAL_COUNT = TESTIMONIALS.length;
const TESTIMONIAL_AUTO_MS = 10_000;

/** Görünür pencerede aktif öğeyi mümkün olduğunca sağda tutar; 5. öğe için pencere kayar. */
function testimonialWindowStart(
  activeIndex: number,
  visible: number,
  total: number
): number {
  const maxStart = Math.max(0, total - visible);
  return Math.min(
    Math.max(activeIndex - (visible - 1), 0),
    maxStart
  );
}

/** Kaydırma ile görünüm — yalnızca Hakkımızda (Elya) sayfası */
const ABOUT_VIEWPORT = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -10% 0px",
} as const;

export function ElyaAboutLanding() {
  const reduceMotion = useReducedMotion();

  const dur = reduceMotion ? 0 : 0.45;
  const y = reduceMotion ? 0 : 18;

  const fadeUp = useMemo(
    () => ({
      hidden: { opacity: 0, y },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: dur, ease: [0.22, 1, 0.36, 1] as const },
      },
    }),
    [dur, y]
  );

  const staggerContainer = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.09,
          delayChildren: reduceMotion ? 0 : 0.05,
        },
      },
    }),
    [reduceMotion]
  );

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialAutoplayKey, setTestimonialAutoplayKey] = useState(0);
  const [shortSlideIndex, setShortSlideIndex] = useState(0);
  const [ytTitles, setYtTitles] = useState<Record<string, string>>({});
  /** İlk boyama: mobil (2 sütun); layout effect ile md+ senkronlanır */
  const [isMdUp, setIsMdUp] = useState(false);
  const reelTrackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const [namesDesktopWide, setNamesDesktopWide] = useState(false);

  useLayoutEffect(() => {
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setNamesDesktopWide(mqLg.matches);
    };
    sync();
    mqLg.addEventListener("change", sync);
    return () => {
      mqLg.removeEventListener("change", sync);
    };
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const namesVisible = namesDesktopWide ? 4 : 2;

  const gallery = useMemo(() => {
    const all = BIZDEN_KARELER_VIDEOS.map((v) => {
      const videoId = parseYoutubeVideoId(v.youtubeUrl);
      if (!videoId) return null;
      return { ...v, videoId };
    }).filter((x): x is typeof x & { videoId: string } => x !== null);

    const landscape = all.find((r) => !r.isShort) ?? null;
    const shorts = all.filter((r) => r.isShort);
    return { all, landscape, shorts };
  }, []);

  const landVideo = gallery.landscape;

  const visibleReelCount = isMdUp ? SHORTS_VISIBLE_DESKTOP : SHORTS_VISIBLE_MOBILE;

  const maxShortSlide = useMemo(
    () => Math.max(0, gallery.shorts.length - visibleReelCount),
    [gallery.shorts.length, visibleReelCount]
  );

  useLayoutEffect(() => {
    const root = reelTrackRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      setTrackWidth(root.offsetWidth);
    });
    ro.observe(root);
    setTrackWidth(root.offsetWidth);
    return () => ro.disconnect();
  }, [gallery.shorts.length, isMdUp, visibleReelCount]);

  useEffect(() => {
    setShortSlideIndex((i) => Math.min(i, maxShortSlide));
  }, [maxShortSlide]);

  const reelCardWidth = useMemo(() => {
    if (trackWidth <= 0) return 0;
    const n = visibleReelCount;
    return (trackWidth - REEL_GAP_PX * (n - 1)) / n;
  }, [trackWidth, visibleReelCount]);

  const reelStepPx = useMemo(
    () => (reelCardWidth > 0 ? reelCardWidth + REEL_GAP_PX : 0),
    [reelCardWidth]
  );

  const reelTranslateX =
    reelStepPx > 0 ? -shortSlideIndex * reelStepPx : 0;

  useEffect(() => {
    const ids = gallery.all.map((r) => r.videoId);
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/public/youtube-titles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds: ids }),
        });
        if (!r.ok) return;
        const j = (await r.json()) as { titles?: Record<string, string> };
        if (!cancelled && j.titles) setYtTitles(j.titles);
      } catch {
        /* yoksay */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gallery.all]);

  const titleFor = useCallback(
    (videoId: string, fallback: string) => ytTitles[videoId] ?? fallback,
    [ytTitles]
  );

  const testimonialWindow = useMemo(
    () =>
      testimonialWindowStart(
        testimonialIndex,
        namesVisible,
        TESTIMONIAL_COUNT
      ),
    [testimonialIndex, namesVisible]
  );

  const openVideo = useCallback((videoId: string) => {
    setActiveId(videoId);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setActiveId(null);
  }, []);

  const activeEmbed = activeId ? youtubeEmbedUrl(activeId) : null;

  const activeGalleryItem = useMemo(
    () =>
      activeId ? gallery.all.find((r) => r.videoId === activeId) : undefined,
    [activeId, gallery.all]
  );
  const activeIsShort = activeGalleryItem?.isShort ?? true;

  const goShortSlide = useCallback(
    (dir: -1 | 1) => {
      setShortSlideIndex((i) =>
        Math.max(0, Math.min(maxShortSlide, i + dir))
      );
    },
    [maxShortSlide]
  );

  const activeTestimonial = TESTIMONIALS[testimonialIndex];

  const resetTestimonialAutoplay = useCallback(() => {
    setTestimonialAutoplayKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIAL_COUNT);
    }, TESTIMONIAL_AUTO_MS);
    return () => window.clearInterval(id);
  }, [testimonialAutoplayKey]);

  const goTestimonial = useCallback(
    (dir: -1 | 1) => {
      resetTestimonialAutoplay();
      setTestimonialIndex((i) => (i + dir + TESTIMONIAL_COUNT) % TESTIMONIAL_COUNT);
    },
    [resetTestimonialAutoplay]
  );

  const selectTestimonial = useCallback(
    (i: number) => {
      resetTestimonialAutoplay();
      setTestimonialIndex(i);
    },
    [resetTestimonialAutoplay]
  );

  const onTestimonialKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTestimonial(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTestimonial(1);
      }
    },
    [goTestimonial]
  );

  const onCarouselKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (gallery.shorts.length <= visibleReelCount) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goShortSlide(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goShortSlide(1);
      }
    },
    [goShortSlide, gallery.shorts.length, visibleReelCount]
  );

  const showReelNav = gallery.shorts.length > visibleReelCount;

  return (
    <>
      <div className="bg-background">
        <motion.section
          className={cn(
            contentCol,
            "py-8 text-center sm:py-12 md:py-14 lg:py-16"
          )}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={ABOUT_VIEWPORT}
        >
          <div className="mx-auto w-full">
            <motion.h1
              className="font-serif text-xl font-bold tracking-tight sm:text-2xl md:text-3xl"
              variants={fadeUp}
            >
              Hakkımızda
            </motion.h1>
            {ELYA_ABOUT_FULL_PARAGRAPHS.map((p, i) => (
              <motion.p
                key={i}
                className={cn(
                  "text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl",
                  i === 0 ? "mt-6 sm:mt-8" : "mt-4 sm:mt-5"
                )}
                variants={fadeUp}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </motion.section>

        <section className="pt-4 pb-8 sm:pt-6 sm:pb-12 md:pt-8 md:pb-16">
          <div className={contentCol}>
            <div
              className={cn(
                "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              tabIndex={0}
              onKeyDown={onCarouselKeyDown}
              aria-label="Bizden Kareler videoları. Kısa videolar için klavye okları ile kaydırın."
            >
          <div className="min-w-0 text-center">
            <h2 className="font-serif text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              Bizden Kareler
            </h2>
          </div>

          <div
            className={cn("mt-4 w-full min-w-0 sm:mt-6", BIZDEN_KARELER_MAX_W, "mx-auto")}
          >
            <div className="flex flex-col gap-6 sm:gap-8">
              {landVideo ? (
                <article
                  key={landVideo.videoId}
                  className="mx-auto flex w-full max-w-[min(100%,720px)] flex-col"
                >
                  <div className="overflow-hidden rounded-lg">
                    <ElyaYoutubeThumbnailButton
                      videoId={landVideo.videoId}
                      title={titleFor(landVideo.videoId, landVideo.title)}
                      onClick={() => openVideo(landVideo.videoId)}
                      aspectClassName="aspect-video"
                      hideCaption
                      overlay="none"
                      showWatchLabel
                      watchLabelClassName="right-3 top-3 left-auto bottom-auto -translate-x-0 rounded-none rounded-bl-md px-4 py-2 text-sm sm:right-4 sm:top-4 sm:px-5 sm:py-2.5 sm:text-base"
                      className="rounded-none border-0 shadow-none hover:translate-y-0 hover:shadow-none"
                      imageSizes="960px"
                      imageClassName="scale-[1.36] object-cover object-center transition-transform duration-300 group-hover:scale-[1.42]"
                    />
                  </div>
                </article>
              ) : null}

              {gallery.shorts.length > 0 ? (
                <div className="w-full min-w-0">
                  {showReelNav ? (
                    <div className="mb-3 flex justify-center gap-2 md:hidden">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-full"
                        disabled={shortSlideIndex <= 0}
                        onClick={() => goShortSlide(-1)}
                        aria-label="Önceki kısa videolar"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-full"
                        disabled={shortSlideIndex >= maxShortSlide}
                        onClick={() => goShortSlide(1)}
                        aria-label="Sonraki kısa videolar"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex w-full min-w-0 items-stretch gap-2 md:gap-4">
                    {showReelNav ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="hidden h-10 w-10 shrink-0 self-center rounded-full md:h-11 md:w-11 md:flex"
                        disabled={shortSlideIndex <= 0}
                        onClick={() => goShortSlide(-1)}
                        aria-label="Önceki kısa videolar"
                      >
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    ) : null}

                    <div
                      ref={reelTrackRef}
                      className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
                    >
                      <motion.div
                        className="flex"
                        style={{ gap: REEL_GAP_PX }}
                        animate={{ x: reelTranslateX }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                type: "spring",
                                stiffness: 380,
                                damping: 34,
                                mass: 0.85,
                              }
                        }
                      >
                        {gallery.shorts.map((item) => (
                          <div
                            key={item.videoId}
                            className="shrink-0"
                            style={{
                              width: reelCardWidth,
                              minWidth: reelCardWidth,
                              flexShrink: 0,
                            }}
                          >
                            <ElyaYoutubeReelSquare
                              videoId={item.videoId}
                              title={titleFor(item.videoId, item.title)}
                              onPlay={() => openVideo(item.videoId)}
                              imageSizes={
                                isMdUp ? "320px" : "50vw"
                              }
                            />
                          </div>
                        ))}
                      </motion.div>
                    </div>

                    {showReelNav ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="hidden h-10 w-10 shrink-0 self-center rounded-full md:h-11 md:w-11 md:flex"
                        disabled={shortSlideIndex >= maxShortSlide}
                        onClick={() => goShortSlide(1)}
                        aria-label="Sonraki kısa videolar"
                      >
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
            </div>
          </div>
        </section>

        <motion.section
          className={cn(
            contentCol,
            "grid gap-8 sm:gap-10 py-10 sm:py-14 md:py-20 md:grid-cols-2 md:gap-12 lg:gap-16 md:items-start"
          )}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={ABOUT_VIEWPORT}
        >
              <motion.div className="min-w-0" variants={fadeUp}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:mb-5 sm:h-14 sm:w-14">
                  <Heart className="h-6 w-6 fill-primary/30 sm:h-7 sm:w-7" aria-hidden />
                </div>
                <h2 className="font-serif text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                  Müşterilerimiz ne söylüyor?
                </h2>
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
                  Hissedarlarımızın deneyimlerinden kısa alıntılar. Gerçek isimler gizlilik için
                  kısaltılmıştır.
                </p>
              </motion.div>

              <motion.div
                className="min-w-0 space-y-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:space-y-5"
                tabIndex={0}
                onKeyDown={onTestimonialKeyDown}
                aria-label="Hissedar görüşleri. Sol ve sağ ok tuşları ile değiştirin."
                variants={staggerContainer}
              >
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background sm:h-10 sm:w-10"
                  variants={fadeUp}
                >
                  <Quote className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                </motion.div>

                <motion.div
                  className="flex items-center justify-between gap-3"
                  variants={fadeUp}
                >
                  <div className="flex min-w-0 flex-1 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400 sm:h-5 sm:w-5"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <div className="flex shrink-0 gap-1.5 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
                      onClick={() => goTestimonial(-1)}
                      aria-label="Önceki görüş"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
                      onClick={() => goTestimonial(1)}
                      aria-label="Sonraki görüş"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>

                <motion.div className="flex flex-col gap-2 md:gap-3" variants={fadeUp}>
                  <h3 className="text-base font-semibold sm:text-lg md:min-h-[2lh]">
                    {activeTestimonial.quoteTitle}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base md:min-h-[2lh]">
                    {activeTestimonial.body}
                  </p>
                </motion.div>

                <motion.div
                  className={cn(
                    "grid gap-2 pt-2 sm:gap-2.5 sm:pt-4",
                    namesVisible === 2 ? "grid-cols-2" : "grid-cols-4"
                  )}
                  variants={fadeUp}
                >
                  {TESTIMONIALS.slice(
                    testimonialWindow,
                    testimonialWindow + namesVisible
                  ).map((t, offset) => {
                    const i = testimonialWindow + offset;
                    return (
                      <button
                        key={`${t.name}-${i}`}
                        type="button"
                        onClick={() => selectTestimonial(i)}
                        className={cn(
                          "min-w-0 rounded-lg border px-2.5 py-2.5 text-left transition sm:px-3 sm:py-3",
                          i === testimonialIndex
                            ? "border-border bg-muted text-foreground shadow-sm"
                            : "border-transparent bg-transparent opacity-45 hover:opacity-80"
                        )}
                      >
                        <p className="text-sm font-semibold leading-tight sm:text-base">
                          {t.name}
                        </p>
                        <p className="mt-1 text-xs leading-tight text-muted-foreground sm:text-sm">
                          {t.role}
                        </p>
                      </button>
                    );
                  })}
                </motion.div>
              </motion.div>
        </motion.section>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "z-[100] border-0 bg-black p-0 sm:rounded-lg",
            activeIsShort
              ? "max-h-[min(92vh,880px)] max-w-[min(100vw-2rem,22rem)]"
              : "max-w-[min(100vw-2rem,56rem)]"
          )}
          overlayClassName="z-[100]"
        >
          <DialogTitle className="sr-only">Video oynatıcı</DialogTitle>
          {activeEmbed ? (
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-lg bg-black",
                activeIsShort
                  ? "aspect-[9/16] max-h-[min(92vh,880px)]"
                  : "aspect-video"
              )}
            >
              <iframe
                title="YouTube video"
                src={activeEmbed}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
