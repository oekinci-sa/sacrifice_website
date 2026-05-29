import fs from "node:fs";
import path from "node:path";

const OUT = path.join(
  process.cwd(),
  "reports",
  "elya-2026-kurban-gunu-gecikme-raporu.csv",
);

const summary = {
  organizasyon: "Elya Hayvancılık",
  yil: 2026,
  kurban_gunu: "2026-05-27",
  kapsam: "Kurban No 1-126",
  rapor_tarihi: "2026-05-29",
  toplam: 126,
  kesilen: 126,
  teslim_edilen: 124,
  kesildi_teslim_yok: 2,
  kesim_ort: 129.7,
  kesim_medyan: 137,
  kesim_min: 6,
  kesim_min_no: 3,
  kesim_max: 223,
  kesim_max_no: 111,
  teslim_ort: 126,
  teslim_medyan: 106,
  teslim_min: -50,
  teslim_min_no: 2,
  teslim_max: 295,
  teslim_max_no: 120,
  kesim_teslim_ort: 117,
  kesim_teslim_medyan: 94.5,
  kesim_buckets: {
    "0-15 dk geç": 3,
    "15-30 dk geç": 1,
    "30-60 dk geç": 11,
    "60+ dk geç": 111,
  },
  teslim_buckets: {
    "Erken (-30 dk altı)": 6,
    "Erken (-30 ile 0 arası)": 6,
    "0-15 dk geç": 5,
    "15-30 dk geç": 5,
    "30-60 dk geç": 14,
    "60+ dk geç": 88,
    "Teslim yok": 2,
  },
  kt_buckets: {
    "120 dk altı": 75,
    "120-135 dk": 8,
    "135-150 dk": 5,
    "150-180 dk": 17,
    "180+ dk": 19,
    "Teslim yok": 2,
  },
};

/** @type {Array<Record<string, string | number | null>>} */
const rows = [
  [1,"06:30","06:36:45",7,"08:30","07:42:05",-48,65,"Kesildi + teslim"],
  [2,"06:32","06:40:02",8,"08:32","07:41:36",-50,62,"Kesildi + teslim"],
  [3,"06:34","06:39:45",6,"08:34","07:46:14",-48,66,"Kesildi + teslim"],
  [4,"06:36","07:01:14",25,"08:36","08:09:55",-26,69,"Kesildi + teslim"],
  [5,"06:38","07:09:47",32,"08:38","07:57:16",-41,47,"Kesildi + teslim"],
  [6,"06:40","07:15:20",35,"08:40","08:02:01",-38,47,"Kesildi + teslim"],
  [7,"06:42","07:26:46",45,"08:42","08:20:58",-21,54,"Kesildi + teslim"],
  [8,"06:44","07:26:54",43,"08:44","08:21:17",-23,54,"Kesildi + teslim"],
  [9,"06:46","07:32:08",46,"08:46","08:45:07",-1,73,"Kesildi + teslim"],
  [10,"06:48","07:41:28",53,"08:48","08:17:11",-31,36,"Kesildi + teslim"],
  [11,"06:50","07:46:55",57,"08:50","08:37:57",-12,51,"Kesildi + teslim"],
  [12,"06:52","07:49:49",58,"08:52","08:40:04",-12,50,"Kesildi + teslim"],
  [13,"06:54","07:54:14",60,"08:54","09:02:45",9,69,"Kesildi + teslim"],
  [14,"06:56","07:54:21",58,"08:56","09:06:43",11,72,"Kesildi + teslim"],
  [15,"06:58","07:56:41",59,"08:58","09:07:57",10,71,"Kesildi + teslim"],
  [16,"07:00","08:07:46",68,"09:00","09:01:50",2,54,"Kesildi + teslim"],
  [17,"07:02","08:22:32",81,"09:02","09:32:36",31,70,"Kesildi + teslim"],
  [18,"07:04","08:22:40",79,"09:04","09:16:41",13,54,"Kesildi + teslim"],
  [19,"07:06","08:22:47",77,"09:06","09:25:33",20,63,"Kesildi + teslim"],
  [20,"07:08","08:23:08",75,"09:08","09:33:53",26,71,"Kesildi + teslim"],
  [21,"07:10","08:24:56",75,"09:10","09:43:41",34,79,"Kesildi + teslim"],
  [22,"07:12","08:24:59",73,"09:12","09:37:22",25,72,"Kesildi + teslim"],
  [23,"07:14","08:26:09",72,"09:14","09:40:41",27,75,"Kesildi + teslim"],
  [24,"07:16","08:29:31",74,"09:16","09:50:34",35,81,"Kesildi + teslim"],
  [25,"07:18","08:34:40",77,"09:18","09:53:46",36,79,"Kesildi + teslim"],
  [26,"07:20","08:34:51",75,"09:20","09:46:23",26,72,"Kesildi + teslim"],
  [27,"07:22","08:36:19",74,"09:22","09:55:12",33,79,"Kesildi + teslim"],
  [28,"07:24","08:45:09",81,"09:24","10:11:28",47,86,"Kesildi + teslim"],
  [29,"07:26","08:51:07",85,"09:26","10:19:11",53,88,"Kesildi + teslim"],
  [30,"07:28","08:51:11",83,"09:28","10:16:00",48,85,"Kesildi + teslim"],
  [31,"07:30","08:54:56",85,"09:30","10:14:13",44,79,"Kesildi + teslim"],
  [32,"07:32","09:04:29",92,"09:32","10:42:00",70,98,"Kesildi + teslim"],
  [33,"07:34","09:04:41",91,"09:34","10:31:16",57,87,"Kesildi + teslim"],
  [34,"07:36","09:14:35",99,"09:36","10:31:14",55,77,"Kesildi + teslim"],
  [35,"07:38","09:21:22",103,"09:38","10:30:13",52,69,"Kesildi + teslim"],
  [36,"07:40","09:24:52",105,"09:40","10:53:19",73,88,"Kesildi + teslim"],
  [37,"07:42","09:24:56",103,"09:42","10:41:35",60,77,"Kesildi + teslim"],
  [38,"07:44","09:25:33",102,"09:44","11:02:48",79,97,"Kesildi + teslim"],
  [39,"07:46","09:33:59",108,"09:46","10:44:09",58,70,"Kesildi + teslim"],
  [40,"07:48","09:34:14",106,"09:48","11:02:23",74,88,"Kesildi + teslim"],
  [41,"07:50","09:40:34",111,"09:50","10:58:06",68,78,"Kesildi + teslim"],
  [42,"07:52","09:53:09",121,"09:52","11:23:36",92,90,"Kesildi + teslim"],
  [43,"07:54","09:53:17",119,"09:54","11:05:52",72,73,"Kesildi + teslim"],
  [44,"07:56","09:53:45",118,"09:56","11:30:59",95,97,"Kesildi + teslim"],
  [45,"07:58","09:57:48",120,"09:58","11:09:54",72,72,"Kesildi + teslim"],
  [46,"08:00","09:58:43",119,"10:00","11:10:34",71,72,"Kesildi + teslim"],
  [47,"08:02","10:00:54",119,"10:02","11:22:09",80,81,"Kesildi + teslim"],
  [48,"08:04","10:02:53",119,"10:04","11:37:41",94,95,"Kesildi + teslim"],
  [49,"08:06","10:10:20",124,"10:06","11:36:07",90,86,"Kesildi + teslim"],
  [50,"08:08","10:11:14",123,"10:08","11:35:55",88,85,"Kesildi + teslim"],
  [51,"08:10","10:11:22",121,"10:10","11:49:28",99,98,"Kesildi + teslim"],
  [52,"08:12","10:19:49",128,"10:12","11:47:20",95,88,"Kesildi + teslim"],
  [53,"08:14","10:19:52",126,"10:14","11:50:09",96,90,"Kesildi + teslim"],
  [54,"08:16","10:24:14",128,"10:16","11:49:56",94,86,"Kesildi + teslim"],
  [55,"08:18","10:25:24",127,"10:18","12:00:07",102,95,"Kesildi + teslim"],
  [56,"08:20","10:25:32",126,"10:20","11:59:51",100,94,"Kesildi + teslim"],
  [57,"08:22","10:45:04",143,"10:22","11:58:45",97,74,"Kesildi + teslim"],
  [58,"08:24","10:45:06",141,"10:24","11:58:23",94,73,"Kesildi + teslim"],
  [59,"08:26","10:45:08",139,"10:26","12:09:11",103,84,"Kesildi + teslim"],
  [60,"08:28","10:45:12",137,"10:28","12:19:39",112,94,"Kesildi + teslim"],
  [61,"08:30","10:45:16",135,"10:30","12:07:47",98,83,"Kesildi + teslim"],
  [62,"08:32","10:45:19",133,"10:32","12:21:52",110,97,"Kesildi + teslim"],
  [63,"08:34","10:51:18",137,"10:34","12:10:07",96,79,"Kesildi + teslim"],
  [64,"08:36","10:51:24",135,"10:36","12:21:09",105,90,"Kesildi + teslim"],
  [65,"08:38","10:56:21",138,"10:38","12:35:37",118,99,"Kesildi + teslim"],
  [66,"08:40","10:56:25",136,"10:40","12:27:00",107,91,"Kesildi + teslim"],
  [67,"08:42","10:59:53",138,"10:42","12:44:17",122,104,"Kesildi + teslim"],
  [68,"08:44","10:59:55",136,"10:44","12:38:40",115,99,"Kesildi + teslim"],
  [69,"08:46","11:07:12",141,"10:46","13:05:24",139,118,"Kesildi + teslim"],
  [70,"08:48","11:16:50",149,"10:48","12:38:33",111,82,"Kesildi + teslim"],
  [71,"08:50","11:17:10",147,"10:50","12:45:44",116,89,"Kesildi + teslim"],
  [72,"08:52","11:29:14",157,"10:52","13:32:26",160,123,"Kesildi + teslim"],
  [73,"08:54","11:31:26",157,"10:54","13:32:05",158,121,"Kesildi + teslim"],
  [74,"08:56","11:31:22",155,"10:56","13:05:46",130,94,"Kesildi + teslim"],
  [75,"08:58","11:31:19",153,"10:58","13:32:50",155,122,"Kesildi + teslim"],
  [76,"09:00","11:42:36",163,"11:00","13:20:22",140,98,"Kesildi + teslim"],
  [77,"09:02","11:42:52",161,"11:02","13:34:36",153,112,"Kesildi + teslim"],
  [78,"09:04","11:42:54",159,"11:04","13:57:29",173,135,"Kesildi + teslim"],
  [79,"09:06","11:51:09",165,"11:06","13:57:52",172,127,"Kesildi + teslim"],
  [80,"09:08","11:51:12",163,"11:08","14:05:33",178,134,"Kesildi + teslim"],
  [81,"09:10","11:52:14",162,"11:10","14:16:30",187,144,"Kesildi + teslim"],
  [82,"09:12","11:53:36",162,"11:12","14:10:59",179,137,"Kesildi + teslim"],
  [83,"09:14","11:57:35",164,"11:14","14:10:41",177,133,"Kesildi + teslim"],
  [84,"09:16","11:59:19",163,"11:16","14:38:02",202,159,"Kesildi + teslim"],
  [85,"09:18","11:59:23",161,"11:18","14:36:14",198,157,"Kesildi + teslim"],
  [86,"09:20","11:59:27",159,"11:20","14:17:45",178,138,"Kesildi + teslim"],
  [87,"09:22","11:59:30",158,"11:22","14:46:07",204,167,"Kesildi + teslim"],
  [88,"09:24","11:59:33",156,"11:24","14:58:53",215,179,"Kesildi + teslim"],
  [89,"09:26","11:59:40",154,"11:26","15:16:10",230,196,"Kesildi + teslim"],
  [90,"09:28","11:59:43",152,"11:28","15:03:51",216,184,"Kesildi + teslim"],
  [91,"09:30","11:59:48",150,"11:30","15:41:18",251,222,"Kesildi + teslim"],
  [92,"09:33","12:00:01",147,"11:33","15:19:30",227,199,"Kesildi + teslim"],
  [93,"09:36","12:33:41",178,"11:36","15:30:59",235,177,"Kesildi + teslim"],
  [94,"09:39","12:33:45",175,"11:39","14:39:51",181,126,"Kesildi + teslim"],
  [95,"09:42","12:43:29",181,"11:42","15:04:06",202,141,"Kesildi + teslim"],
  [96,"09:45","13:02:32",198,"11:45","15:46:14",241,164,"Kesildi + teslim"],
  [97,"09:48","13:02:51",195,"11:48","15:43:02",235,160,"Kesildi + teslim"],
  [98,"09:51","13:02:53",192,"11:51","16:00:30",250,178,"Kesildi + teslim"],
  [99,"09:54","13:02:55",189,"11:54","16:05:10",251,182,"Kesildi + teslim"],
  [100,"09:57","11:30:03",93,"11:57","16:25:06",268,295,"Kesildi + teslim"],
  [101,"10:00","13:03:02",183,"12:00","16:02:23",242,179,"Kesildi + teslim"],
  [102,"10:03","13:03:16",180,"12:03","16:08:26",245,185,"Kesildi + teslim"],
  [103,"10:06","13:03:19",177,"12:06","15:42:42",217,159,"Kesildi + teslim"],
  [104,"10:09","13:03:22",174,"12:09","16:03:00",234,180,"Kesildi + teslim"],
  [105,"10:12","13:03:24",171,"12:12","16:21:22",249,198,"Kesildi + teslim"],
  [106,"10:15","13:03:26",168,"12:15","16:31:22",256,208,"Kesildi + teslim"],
  [107,"10:18","13:03:29",165,"12:18","16:21:26",243,198,"Kesildi + teslim"],
  [108,"10:21","13:03:32",163,"12:21","16:21:30",241,198,"Kesildi + teslim"],
  [109,"10:24","13:03:35",160,"12:24","16:31:31",248,208,"Kesildi + teslim"],
  [110,"10:27","13:03:43",157,"12:27","16:48:55",262,225,"Kesildi + teslim"],
  [111,"10:30","14:13:08",223,"12:30","16:39:59",250,147,"Kesildi + teslim"],
  [112,"10:33","14:14:25",221,"12:33","16:46:38",254,152,"Kesildi + teslim"],
  [113,"10:36","14:14:29",218,"12:36","16:49:22",253,155,"Kesildi + teslim"],
  [114,"10:39","13:53:08",194,"12:39","17:15:09",276,202,"Kesildi + teslim"],
  [115,"10:42","14:14:43",213,"12:42","16:59:55",258,165,"Kesildi + teslim"],
  [116,"10:45","14:20:22",215,"12:45","17:04:38",260,164,"Kesildi + teslim"],
  [117,"10:48","14:20:25",212,"12:48","17:20:22",272,180,"Kesildi + teslim"],
  [118,"10:51","14:20:28",209,"12:51","17:14:54",264,174,"Kesildi + teslim"],
  [119,"10:54","13:52:36",179,"12:54","17:39:07",285,227,"Kesildi + teslim"],
  [120,"10:57","13:52:40",176,"12:57","17:51:36",295,239,"Kesildi + teslim"],
  [121,"11:00","13:52:44",173,"13:00","17:39:45",280,227,"Kesildi + teslim"],
  [122,"11:04","14:20:35",197,"13:04","17:33:42",270,193,"Kesildi + teslim"],
  [123,"11:08","14:20:38",193,"13:08","17:58:42",291,218,"Kesildi + teslim"],
  [124,"11:12","14:20:40",189,"13:12","15:21:22",129,61,"Kesildi + teslim"],
  [125,"11:16","13:51:35",156,"13:16",null,null,null,"Kesildi, teslim yok"],
  [126,"11:20","14:20:45",181,"13:20",null,null,null,"Kesildi, teslim yok"],
];

function cell(v) {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function line(...cols) {
  return cols.map(cell).join(",");
}

const lines = [];

lines.push(line("Bölüm", "Metrik", "Değer"));
lines.push(line("Özet", "Organizasyon", summary.organizasyon));
lines.push(line("Özet", "Yıl", summary.yil));
lines.push(line("Özet", "Kurban günü", summary.kurban_gunu));
lines.push(line("Özet", "Kapsam", summary.kapsam));
lines.push(line("Özet", "Rapor tarihi", summary.rapor_tarihi));
lines.push(line("Özet", "Toplam kurbanlık", summary.toplam));
lines.push(line("Özet", "Kesilen", summary.kesilen));
lines.push(line("Özet", "Teslim edilen", summary.teslim_edilen));
lines.push(line("Özet", "Kesildi teslim yok", summary.kesildi_teslim_yok));
lines.push(line("Özet", "Ort. kesim gecikmesi (dk)", summary.kesim_ort));
lines.push(line("Özet", "Medyan kesim gecikmesi (dk)", summary.kesim_medyan));
lines.push(line("Özet", "En erken kesim (dk / no)", `${summary.kesim_min} / ${summary.kesim_min_no}`));
lines.push(line("Özet", "En geç kesim (dk / no)", `${summary.kesim_max} / ${summary.kesim_max_no}`));
lines.push(line("Özet", "Ort. teslim gecikmesi (dk)", summary.teslim_ort));
lines.push(line("Özet", "Medyan teslim gecikmesi (dk)", summary.teslim_medyan));
lines.push(line("Özet", "En erken teslim (dk / no)", `${summary.teslim_min} / ${summary.teslim_min_no}`));
lines.push(line("Özet", "En geç teslim (dk / no)", `${summary.teslim_max} / ${summary.teslim_max_no}`));
lines.push(line("Özet", "Ort. kesim→teslim (dk)", summary.kesim_teslim_ort));
lines.push(line("Özet", "Medyan kesim→teslim (dk)", summary.kesim_teslim_medyan));
lines.push("");

lines.push(line("Kesim gecikmesi dağılımı", "Aralık", "Adet"));
for (const [k, v] of Object.entries(summary.kesim_buckets)) {
  lines.push(line("Kesim", k, v));
}
lines.push("");

lines.push(line("Teslim gecikmesi dağılımı", "Aralık", "Adet"));
for (const [k, v] of Object.entries(summary.teslim_buckets)) {
  lines.push(line("Teslim", k, v));
}
lines.push("");

lines.push(line("Kesim→teslim süresi", "Aralık", "Adet"));
for (const [k, v] of Object.entries(summary.kt_buckets)) {
  lines.push(line("Kesim→Teslim", k, v));
}
lines.push("");

lines.push(
  line(
    "Kurban No",
    "Planlı Kesim",
    "Gerçek Kesim",
    "Kesim Gecikmesi (dk)",
    "Planlı Teslim",
    "Gerçek Teslim",
    "Teslim Gecikmesi (dk)",
    "Kesim→Teslim (dk)",
    "Durum",
  ),
);

for (const r of rows) {
  lines.push(line(...r));
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, "\uFEFF" + lines.join("\r\n") + "\r\n", "utf8");
console.log(`Wrote ${OUT} (${rows.length} detail rows)`);
