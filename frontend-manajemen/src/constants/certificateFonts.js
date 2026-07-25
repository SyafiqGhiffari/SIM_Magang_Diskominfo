// Daftar font untuk desainer template sertifikat.
//
// jsPDF hanya punya 3 keluarga font bawaan (helvetica, times, courier).
// Agar pilihan font bisa banyak TANPA meng-embed file font, setiap opsi punya:
//   - css   : keluarga font yang dipakai di pratinjau browser
//   - pdf   : font bawaan jsPDF terdekat yang dipakai saat sertifikat diekspor
//   - group : pengelompokan di dropdown pemilih font
//
// Font yang tersedia di Google Fonts dimuat lewat <link> di index.html.
// Font berlisensi (Gotham, Gilroy, Avenir, Futura, Frutiger, Univers, Minion,
// Serendipity, dll.) memakai fallback padanan terdekat bila tidak terpasang
// di perangkat pengguna.
export const FONT_OPTS = [
  // ── Serif Klasik ──
  { value: "didot", label: "Didot", group: "Serif Klasik", pdf: "times", css: "Didot, 'Didot LT STD', 'Playfair Display', 'Bodoni MT', Georgia, serif" },
  { value: "bodoni", label: "Bodoni", group: "Serif Klasik", pdf: "times", css: "'Bodoni Moda', 'Bodoni MT', Didot, Georgia, serif" },
  { value: "baskerville", label: "Baskerville", group: "Serif Klasik", pdf: "times", css: "'Libre Baskerville', Baskerville, 'Baskerville Old Face', Georgia, serif" },
  { value: "garamond", label: "Garamond", group: "Serif Klasik", pdf: "times", css: "'EB Garamond', Garamond, 'Apple Garamond', 'Times New Roman', serif" },
  { value: "times", label: "Times New Roman", group: "Serif Klasik", pdf: "times", css: "'Times New Roman', Times, serif" },
  { value: "newyork", label: "New York", group: "Serif Klasik", pdf: "times", css: "'New York', Newsreader, ui-serif, Georgia, serif" },
  { value: "lubalin", label: "ITC Lubalin Graph", group: "Serif Klasik", pdf: "times", css: "'ITC Lubalin Graph', 'Lubalin Graph', Rokkitt, 'Rockwell', serif" },
  { value: "gabriela", label: "Gabriela Stencil", group: "Serif Klasik", pdf: "times", css: "'Gabriela Stencil', Gabriela, 'Stencil Std', Georgia, serif" },
  { value: "minion", label: "Minion", group: "Serif Klasik", pdf: "times", css: "'Minion Pro', Minion, 'Crimson Text', Georgia, serif" },
  { value: "georgia", label: "Georgia", group: "Serif Klasik", pdf: "times", css: "Georgia, 'Times New Roman', serif" },
  { value: "playfair", label: "Playfair Display", group: "Serif Klasik", pdf: "times", css: "'Playfair Display', Georgia, serif" },
  { value: "lora", label: "Lora", group: "Serif Klasik", pdf: "times", css: "Lora, Georgia, serif" },
  { value: "neuton", label: "Neuton", group: "Serif Klasik", pdf: "times", css: "Neuton, Georgia, serif" },
  { value: "arvo", label: "Arvo", group: "Serif Klasik", pdf: "times", css: "Arvo, Rockwell, Georgia, serif" },
  { value: "soria", label: "Soria", group: "Serif Klasik", pdf: "times", css: "Soria, 'Playfair Display', 'Bodoni Moda', Georgia, serif" },
  { value: "sreda", label: "Sreda", group: "Serif Klasik", pdf: "times", css: "Sreda, Lora, Neuton, Georgia, serif" },

  // ── Sans Serif Modern ──
  { value: "helvetica", label: "Helvetica", group: "Sans Serif Modern", pdf: "helvetica", css: "Helvetica, 'Helvetica Neue', Arial, sans-serif" },
  { value: "futura", label: "Futura", group: "Sans Serif Modern", pdf: "helvetica", css: "Futura, 'Futura PT', Jost, 'Century Gothic', sans-serif" },
  { value: "franklin", label: "Franklin Gothic", group: "Sans Serif Modern", pdf: "helvetica", css: "'Franklin Gothic', 'Franklin Gothic Medium', 'Libre Franklin', Arial, sans-serif" },
  { value: "avenir", label: "Avenir", group: "Sans Serif Modern", pdf: "helvetica", css: "Avenir, 'Avenir Next', 'Nunito Sans', 'Segoe UI', sans-serif" },
  { value: "montserrat", label: "Montserrat", group: "Sans Serif Modern", pdf: "helvetica", css: "Montserrat, 'Segoe UI', Arial, sans-serif" },
  { value: "frutiger", label: "Frutiger", group: "Sans Serif Modern", pdf: "helvetica", css: "Frutiger, 'Frutiger LT Std', 'Nunito Sans', 'Segoe UI', sans-serif" },
  { value: "newsgothic", label: "News Gothic", group: "Sans Serif Modern", pdf: "helvetica", css: "'News Gothic', 'News Gothic MT', 'Libre Franklin', Arial, sans-serif" },
  { value: "gotham", label: "Gotham", group: "Sans Serif Modern", pdf: "helvetica", css: "Gotham, 'Gotham HTF', Montserrat, 'Segoe UI', sans-serif" },
  { value: "gilroy", label: "Gilroy", group: "Sans Serif Modern", pdf: "helvetica", css: "Gilroy, Poppins, 'Segoe UI', sans-serif" },
  { value: "univers", label: "Univers", group: "Sans Serif Modern", pdf: "helvetica", css: "Univers, 'Univers LT Std', Roboto, Helvetica, sans-serif" },
  { value: "arial", label: "Arial", group: "Sans Serif Modern", pdf: "helvetica", css: "Arial, Helvetica, sans-serif" },
  { value: "verdana", label: "Verdana", group: "Sans Serif Modern", pdf: "helvetica", css: "Verdana, Geneva, sans-serif" },
  { value: "tahoma", label: "Tahoma", group: "Sans Serif Modern", pdf: "helvetica", css: "Tahoma, Verdana, sans-serif" },
  { value: "inter", label: "Inter", group: "Sans Serif Modern", pdf: "helvetica", css: "Inter, 'Segoe UI', Arial, sans-serif" },
  { value: "josefin", label: "Josefin Sans", group: "Sans Serif Modern", pdf: "helvetica", css: "'Josefin Sans', 'Century Gothic', sans-serif" },
  { value: "roboto", label: "Roboto", group: "Sans Serif Modern", pdf: "helvetica", css: "Roboto, 'Helvetica Neue', Arial, sans-serif" },
  { value: "opensans", label: "Open Sans", group: "Sans Serif Modern", pdf: "helvetica", css: "'Open Sans', 'Segoe UI', Arial, sans-serif" },
  { value: "rubik", label: "Rubik", group: "Sans Serif Modern", pdf: "helvetica", css: "Rubik, 'Segoe UI', Arial, sans-serif" },
  { value: "dmsans", label: "DM Sans", group: "Sans Serif Modern", pdf: "helvetica", css: "'DM Sans', 'Segoe UI', Arial, sans-serif" },
  { value: "poppins", label: "Poppins", group: "Sans Serif Modern", pdf: "helvetica", css: "Poppins, 'Segoe UI', Arial, sans-serif" },
  { value: "lato", label: "Lato", group: "Sans Serif Modern", pdf: "helvetica", css: "Lato, 'Segoe UI', Arial, sans-serif" },
  { value: "nunito", label: "Nunito", group: "Sans Serif Modern", pdf: "helvetica", css: "Nunito, 'Nunito Sans', 'Segoe UI', sans-serif" },
  { value: "ubuntu", label: "Ubuntu", group: "Sans Serif Modern", pdf: "helvetica", css: "Ubuntu, 'Segoe UI', Arial, sans-serif" },
  { value: "ranade", label: "Ranade", group: "Sans Serif Modern", pdf: "helvetica", css: "Ranade, 'Work Sans', 'Segoe UI', sans-serif" },
  { value: "sourcesans", label: "Source Sans Pro", group: "Sans Serif Modern", pdf: "helvetica", css: "'Source Sans 3', 'Source Sans Pro', 'Segoe UI', sans-serif" },
  { value: "worksans", label: "Work Sans", group: "Sans Serif Modern", pdf: "helvetica", css: "'Work Sans', 'Segoe UI', Arial, sans-serif" },
  { value: "manrope", label: "Manrope", group: "Sans Serif Modern", pdf: "helvetica", css: "Manrope, 'Segoe UI', Arial, sans-serif" },
  { value: "objectsans", label: "Object Sans", group: "Sans Serif Modern", pdf: "helvetica", css: "'Object Sans', Manrope, Poppins, 'Segoe UI', sans-serif" },
  { value: "raleway", label: "Raleway", group: "Sans Serif Modern", pdf: "helvetica", css: "Raleway, 'Segoe UI', Arial, sans-serif" },

  // ── Dekoratif & Skrip ──
  { value: "lobster", label: "Lobster", group: "Dekoratif & Skrip", pdf: "times", css: "Lobster, 'Brush Script MT', cursive" },
  { value: "grapenuts", label: "Grape Nuts", group: "Dekoratif & Skrip", pdf: "times", css: "'Grape Nuts', 'Segoe Script', cursive" },
  { value: "allura", label: "Allura", group: "Dekoratif & Skrip", pdf: "times", css: "Allura, 'Apple Chancery', cursive" },
  { value: "serendipity", label: "Serendipity", group: "Dekoratif & Skrip", pdf: "times", css: "Serendipity, 'Parisienne', 'Apple Chancery', cursive" },
  { value: "pacifico", label: "Pacifico", group: "Dekoratif & Skrip", pdf: "times", css: "Pacifico, 'Brush Script MT', cursive" },
  { value: "alexbrush", label: "Alex Brush", group: "Dekoratif & Skrip", pdf: "times", css: "'Alex Brush', 'Brush Script MT', cursive" },
  { value: "rocksalt", label: "Rock Salt", group: "Dekoratif & Skrip", pdf: "times", css: "'Rock Salt', 'Segoe Script', cursive" },
  { value: "croissant", label: "Croissant", group: "Dekoratif & Skrip", pdf: "times", css: "'Croissant One', Croissant, Georgia, serif" },
  { value: "amita", label: "Amita", group: "Dekoratif & Skrip", pdf: "times", css: "Amita, 'Apple Chancery', cursive" },
  { value: "cookie", label: "Cookie", group: "Dekoratif & Skrip", pdf: "times", css: "Cookie, 'Apple Chancery', cursive" },

  // ── Monospace ──
  { value: "courier", label: "Courier New", group: "Monospace", pdf: "courier", css: "'Courier New', Courier, monospace" },
  { value: "consolas", label: "Consolas", group: "Monospace", pdf: "courier", css: "Consolas, 'Lucida Console', monospace" },
];

// Urutan grup pada dropdown pemilih font
export const FONT_GROUPS = ["Serif Klasik", "Sans Serif Modern", "Dekoratif & Skrip", "Monospace"];

export const fontCss = (v) => FONT_OPTS.find((f) => f.value === v)?.css || FONT_OPTS[0].css;

export const fontLabel = (v) => FONT_OPTS.find((f) => f.value === v)?.label || "Pilih font";

// Font bawaan jsPDF terdekat untuk sebuah pilihan font
export const pdfFontOf = (v) => FONT_OPTS.find((f) => f.value === v)?.pdf || "helvetica";