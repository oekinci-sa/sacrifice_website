"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ChevronRight } from "lucide-react";

import { ElyaYoutubeThumbnailButton } from "@/components/elya/elya-youtube-thumbnail-button";
import CustomLink from "@/components/custom-data-components/custom-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { youtubeEmbedUrl } from "@/lib/youtube";

export interface BizdenKarelerResolvedItem {
  title: string;
  videoId: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.06 },
  }),
};

const META_ITEMS = [
  { label: "Organizasyon", value: "Elya Hayvancılık" },
  { label: "Bölge", value: "Gölbaşı, Ankara" },
  { label: "Hizmet", value: "Kurban organizasyonu" },
] as const;

const STAT_ITEMS = [
  { figure: "Modern", caption: "Kesimhane ve süreç takibi" },
  { figure: "Şeffaf", caption: "Hisse ve teslimat bilgisi" },
  { figure: "Güvenilir", caption: "Yılların tecrübesiyle hizmet" },
] as const;

function VideoThumbnail({
  videoId,
  title,
  onClick,
  index,
}: {
  videoId: string;
  title: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      <ElyaYoutubeThumbnailButton videoId={videoId} title={title} onClick={onClick} />
    </motion.div>
  );
}

export function BizdenKarelerClient({ items }: { items: BizdenKarelerResolvedItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const openVideo = useCallback((videoId: string) => {
    setActiveId(videoId);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setActiveId(null);
  }, []);

  const activeEmbed = activeId ? youtubeEmbedUrl(activeId) : null;

  return (
    <>
      {/* Hero — case study açılışı */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/[0.06] via-background to-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container relative py-12 md:py-16 lg:py-20">
          <motion.nav
            className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            aria-label="Sayfa konumu"
          >
            <CustomLink href="/" className="text-sm font-normal hover:text-primary">
              Anasayfa
            </CustomLink>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            <span className="text-foreground">Bizden Kareler</span>
          </motion.nav>

          <motion.h1
            className="max-w-4xl font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            Bizden Kareler
          </motion.h1>
          <motion.p
            className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            Kesimhanemizden, süreçlerimizden ve organizasyonumuza dair seçtiğimiz
            videoları burada izleyebilirsiniz. Her kare, güven ve şeffaflık ilkemizle
            yürüttüğümüz hizmetin bir parçasıdır.
          </motion.p>
        </div>
      </section>

      {/* Üst meta şeridi — Mizzle tarzı özet satırı */}
      <section className="border-b border-border/60 bg-muted/25">
        <div className="container py-8 md:py-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:gap-8">
            {META_ITEMS.map((row, i) => (
              <motion.div
                key={row.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="rounded-xl border border-border/80 bg-background/80 px-5 py-4 shadow-sm backdrop-blur-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </p>
                <p className="mt-2 text-base font-medium text-foreground md:text-lg">{row.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* İçerik: yan özet + gövde */}
      <div className="container py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-4">
            <div className="space-y-8 lg:sticky lg:top-28">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <h2 className="font-serif text-2xl font-semibold tracking-tight">Özet</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Videolarımızda tesisimizi, çalışma disiplinimizi ve kurban sürecine
                  yaklaşımımızı kısaca görebilirsiniz. Sorularınız için iletişim
                  sayfamızdan bize ulaşabilirsiniz.
                </p>
              </motion.div>
              <motion.div
                className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] p-5"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                <p className="text-sm font-medium text-foreground">Hisse almak ister misiniz?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Güncel dönem hisse ve fiyat bilgisi için Hisse Al sayfasına geçebilirsiniz.
                </p>
                <Button className="mt-4 w-full sm:w-auto" asChild>
                  <Link href="/hisseal">Hisse Al</Link>
                </Button>
              </motion.div>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <motion.section
              className="mb-12 md:mb-14"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
                Genel bakış
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Aşağıdaki videolardan birine tıklayarak oynatıcıyı açabilirsiniz. Tüm içerikler
                sayfamız içinde kalır; yeni sekmede YouTube’a yönlendirme yapılmaz.
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <h2 className="mb-8 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
                Videolar
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:gap-7">
                {items.map((item, index) => (
                  <VideoThumbnail
                    key={`${item.videoId}-${index}`}
                    videoId={item.videoId}
                    title={item.title}
                    index={index}
                    onClick={() => openVideo(item.videoId)}
                  />
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      {/* İstatistik / vurgu şeridi */}
      <section className="border-t border-border/60 bg-muted/30">
        <div className="container py-14 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STAT_ITEMS.map((s, i) => (
              <motion.div
                key={s.caption}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="font-serif text-3xl font-bold tracking-tight text-primary md:text-4xl">
                  {s.figure}
                </p>
                <p className="mt-3 text-sm text-muted-foreground md:text-base">{s.caption}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Alt CTA */}
      <section className="border-t border-border/40 pb-16 pt-10 md:pb-20">
        <div className="container text-center">
          <p className="text-lg text-muted-foreground">
            Kurban organizasyonumuz hakkında daha fazla bilgi için{" "}
            <CustomLink href="/hakkimizda" className="inline text-base md:text-lg">
              Hakkımızda
            </CustomLink>{" "}
            sayfasını ziyaret edebilir veya bizimle iletişime geçebilirsiniz.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild>
              <Link href="/hisseal">Hisse Al</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/iletisim">İletişim</Link>
            </Button>
          </div>
        </div>
      </section>

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
