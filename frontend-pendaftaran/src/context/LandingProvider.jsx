import { useEffect, useState } from "react";
import { getLandingConfig } from "../services/landingService";
import { FALLBACK, LandingContext } from "./landingContext";

export const LandingProvider = ({ children }) => {
  const [config, setConfig] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    getLandingConfig()
      .then((res) => {
        if (!aktif) return;
        const d = res.data?.data;
        if (d) {
          setConfig({
            identitas: { ...FALLBACK.identitas, ...(d.identitas || {}) },
            kontak: { ...FALLBACK.kontak, ...(d.kontak || {}) },
            sosial_media: { ...FALLBACK.sosial_media, ...(d.sosial_media || {}) },
            pendaftaran: { ...FALLBACK.pendaftaran, ...(d.pendaftaran || {}) },
            banner: { ...FALLBACK.banner, ...(d.banner || {}) },
            hero: { ...FALLBACK.hero, ...(d.hero || {}) },
            hero_slides:
              Array.isArray(d.hero_slides) && d.hero_slides.length > 0
                ? d.hero_slides
                : FALLBACK.hero_slides,
            bidang: Array.isArray(d.bidang) ? d.bidang : [],
            konten: { ...FALLBACK.konten, ...(d.konten || {}) },
            tentang: { ...FALLBACK.tentang, ...(d.tentang || {}) },
            seo: { ...FALLBACK.seo, ...(d.seo || {}) },
            menu: {
              navbar:
                Array.isArray(d.menu?.navbar) && d.menu.navbar.length > 0
                  ? d.menu.navbar
                  : FALLBACK.menu.navbar,
              footer: Array.isArray(d.menu?.footer)
                ? d.menu.footer
                : FALLBACK.menu.footer,
            },
          });
        }
      })
      .catch(() => {
        /* biarkan memakai FALLBACK */
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Terapkan favicon dinamis
  useEffect(() => {
    const url = config.identitas?.favicon;
    if (!url) return;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [config.identitas?.favicon]);

  // Terapkan judul & meta tag SEO secara dinamis
  useEffect(() => {
    const seo = config.seo || {};

    // Pastikan sebuah <meta> ada, lalu isi kontennya.
    const pasangMeta = (jenisAtribut, nama, isi) => {
      if (!isi) return;
      let tag = document.querySelector(`meta[${jenisAtribut}="${nama}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(jenisAtribut, nama);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", isi);
    };

    if (seo.title) document.title = seo.title;

    pasangMeta("name", "description", seo.description);
    pasangMeta("name", "keywords", seo.keywords);

    // Open Graph — dipakai WhatsApp, Facebook, LinkedIn
    pasangMeta("property", "og:type", "website");
    pasangMeta("property", "og:site_name", config.identitas?.nama_situs);
    pasangMeta("property", "og:title", seo.title);
    pasangMeta("property", "og:description", seo.description);
    pasangMeta("property", "og:image", seo.og_image);
    pasangMeta("property", "og:url", window.location.origin);

    // Twitter Card
    pasangMeta("name", "twitter:card", seo.og_image ? "summary_large_image" : "summary");
    pasangMeta("name", "twitter:title", seo.title);
    pasangMeta("name", "twitter:description", seo.description);
    pasangMeta("name", "twitter:image", seo.og_image);
  }, [
    config.seo?.title,
    config.seo?.description,
    config.seo?.keywords,
    config.seo?.og_image,
    config.identitas?.nama_situs,
  ]);

  return (
    <LandingContext.Provider value={{ config, loading }}>
      {children}
    </LandingContext.Provider>
  );
};

export default LandingProvider;