/** Elya Hakkımızda — «Bizden Kareler» bölümü video listesi (önce yatay, ardından Shorts). */

export interface BizdenKarelerVideoItem {
  title: string;
  youtubeUrl: string;
  /** YouTube Shorts (9:16); false ise klasik yatay video */
  isShort: boolean;
  /** Kartta başlığın altındaki kısa metin */
  sectionLead: string;
}

export const BIZDEN_KARELER_VIDEOS: BizdenKarelerVideoItem[] = [
  {
    title: "Kurumsal tanıtım",
    youtubeUrl: "https://www.youtube.com/watch?v=dAGRwyGrNrM",
    isShort: false,
    sectionLead: "",
  },
  {
    title: "Kare 1",
    youtubeUrl: "https://www.youtube.com/shorts/bVnhiceL4YU",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 2",
    youtubeUrl: "https://www.youtube.com/shorts/qvHKXdvgTGc",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 3",
    youtubeUrl: "https://www.youtube.com/shorts/vIcXTDV5G3s",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 4",
    youtubeUrl: "https://www.youtube.com/shorts/TaSwyU75a_I",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 5",
    youtubeUrl: "https://www.youtube.com/shorts/ZaDIsPhKWjI",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 6",
    youtubeUrl: "https://www.youtube.com/shorts/9r1ZTCXEk2g",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 7",
    youtubeUrl: "https://www.youtube.com/shorts/dsS0N3ibnLE",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 8",
    youtubeUrl: "https://www.youtube.com/shorts/WA35a_afidI",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
  {
    title: "Kare 9",
    youtubeUrl: "https://www.youtube.com/shorts/RFQprF-HELA",
    isShort: true,
    sectionLead: "Organizasyonumuzdan kısa bir kare.",
  },
];
