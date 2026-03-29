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

import { ElyaYoutubeThumbnailButton } from "@/components/elya/elya-youtube-thumbnail-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ELYA_GALLERY_VIDEOS } from "@/lib/elya-gallery-videos";
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

const GAP_PX = 24;

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
  const [slideIndex, setSlideIndex] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [galleryDesktop, setGalleryDesktop] = useState(false);
  const [namesDesktopWide, setNamesDesktopWide] = useState(false);

  useLayoutEffect(() => {
    const mqMd = window.matchMedia("(min-width: 768px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setGalleryDesktop(mqMd.matches);
      setNamesDesktopWide(mqLg.matches);
    };
    sync();
    mqMd.addEventListener("change", sync);
    mqLg.addEventListener("change", sync);
    return () => {
      mqMd.removeEventListener("change", sync);
      mqLg.removeEventListener("change", sync);
    };
  }, []);

  const cardsPerView = galleryDesktop ? 3 : 1;
  const namesVisible = namesDesktopWide ? 4 : 2;

  const rows = useMemo(() => {
    return ELYA_GALLERY_VIDEOS.map((v) => {
      const videoId = parseYoutubeVideoId(v.youtubeUrl);
      if (!videoId) return null;
      return { ...v, videoId };
    }).filter((x): x is typeof x & { videoId: string } => x !== null);
  }, []);

  const cardWidth =
    viewportW > 0 && cardsPerView > 0
      ? Math.max(
          0,
          (viewportW - Math.max(0, cardsPerView - 1) * GAP_PX) / cardsPerView
        )
      : 0;
  const stepPx = cardWidth + GAP_PX;
  const maxSlide = Math.max(0, rows.length - cardsPerView);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportW(el.offsetWidth);
    });
    ro.observe(el);
    setViewportW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setSlideIndex((i) => Math.min(i, maxSlide));
  }, [maxSlide]);

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

  const goSlide = useCallback(
    (dir: -1 | 1) => {
      setSlideIndex((i) => Math.max(0, Math.min(maxSlide, i + dir)));
    },
    [maxSlide]
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
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goSlide(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goSlide(1);
      }
    },
    [goSlide]
  );

  return (
    <>
      <div className="bg-background">
        <motion.section
          className={cn(
            contentCol,
            "py-8 sm:py-12 md:py-14 lg:py-16"
          )}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={ABOUT_VIEWPORT}
        >
          <motion.p
            className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary sm:mb-3 sm:text-sm"
            variants={fadeUp}
          >
            Elya Hayvancılık
          </motion.p>
          <motion.h1
            className="font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
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
        </motion.section>

        <section className="bg-muted/25 py-8 sm:py-12 md:py-16">
          <div className={contentCol}>
            <motion.div
              className={cn(
                "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              tabIndex={0}
              onKeyDown={onCarouselKeyDown}
              aria-label="Bizden Kareler videoları. Klavye okları ile kaydırın."
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={ABOUT_VIEWPORT}
            >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <motion.div className="min-w-0 flex-1" variants={fadeUp}>
              <h2 className="font-serif text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                Bizden Kareler
              </h2>
            </motion.div>
            <motion.div
              className="flex shrink-0 gap-2 self-end sm:self-start"
              variants={fadeUp}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full sm:h-11 sm:w-11"
                disabled={slideIndex <= 0}
                onClick={() => goSlide(-1)}
                aria-label="Önceki videolar"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full sm:h-11 sm:w-11"
                disabled={slideIndex >= maxSlide}
                onClick={() => goSlide(1)}
                aria-label="Sonraki videolar"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
          </div>

          <motion.div
            ref={viewportRef}
            className="mt-6 w-full min-w-0 overflow-hidden sm:mt-8"
            variants={fadeUp}
          >
            {cardWidth > 0 ? (
              <div
                className="flex transition-transform duration-500 ease-out will-change-transform"
                style={{
                  gap: GAP_PX,
                  transform: `translate3d(-${slideIndex * stepPx}px, 0, 0)`,
                }}
              >
                {rows.map((item) => (
                  <article
                    key={item.videoId + item.title}
                    className="flex shrink-0 flex-col overflow-hidden rounded-sm border border-border/60 bg-card"
                    style={{ width: cardWidth }}
                  >
                    <ElyaYoutubeThumbnailButton
                      videoId={item.videoId}
                      title={item.title}
                      onClick={() => openVideo(item.videoId)}
                      aspectClassName="aspect-video"
                      hideCaption
                      className="rounded-none rounded-t-sm border-0 shadow-none hover:translate-y-0 hover:shadow-none"
                      imageSizes={
                        cardsPerView === 1 ? "100vw" : "(max-width: 1280px) 33vw, 400px"
                      }
                    />
                    <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-5">
                      <h3 className="text-base font-semibold leading-snug sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {item.sectionLead}
                      </p>
                      <button
                        type="button"
                        className="mt-auto text-left text-xs font-medium text-primary hover:underline sm:text-sm"
                        onClick={() => openVideo(item.videoId)}
                      >
                        Videoyu izle →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                className="min-h-[200px] w-full rounded-sm bg-muted/30 sm:min-h-[280px]"
                aria-hidden
              />
            )}
          </motion.div>
            </motion.div>
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
          className="z-[100] max-w-[min(100vw-2rem,56rem)] border-0 bg-black p-0 sm:rounded-lg"
          overlayClassName="z-[100]"
        >
          <DialogTitle className="sr-only">Video oynatıcı</DialogTitle>
          {activeEmbed ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
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
