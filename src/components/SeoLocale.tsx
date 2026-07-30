import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS } from "@/i18n";

export const SITE_URL = "https://tutorspool.com";

/** Routes that must never be indexed (private / transactional surfaces). */
const PRIVATE_PREFIXES = [
  "/student",
  "/tutor/",
  "/admin",
  "/parent",
  "/results",
  "/login",
  "/register",
  "/forgot-password",
];

const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  ar: "ar_AE",
  es: "es_ES",
};

function isPrivate(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p) || pathname === p.replace(/\/$/, "")
  );
}

/**
 * Emits language-targeting signals for every route:
 *  - hreflang alternates (en / ar / es / x-default) so search engines serve
 *    the right language version to users in each region
 *  - og:locale + og:locale:alternate
 *  - noindex on private app routes
 * Canonicals stay owned by each page component.
 */
export function SeoLocale() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const priv = isPrivate(pathname);
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  if (priv) {
    return (
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    );
  }

  return (
    <Helmet>
      <html lang={lang} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta property="og:locale" content={OG_LOCALES[lang] || "en_US"} />
      {SUPPORTED_LANGS.filter((l) => l.code !== lang).map((l) => (
        <meta key={l.code} property="og:locale:alternate" content={OG_LOCALES[l.code]} />
      ))}
      {SUPPORTED_LANGS.map((l) => (
        <link
          key={l.code}
          rel="alternate"
          hrefLang={l.code}
          href={`${SITE_URL}${path}${l.code === "en" ? "" : `?lng=${l.code}`}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${path}`} />
    </Helmet>
  );
}

/** BreadcrumbList JSON-LD helper for content pages. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: `${SITE_URL}${item.path}`,
          })),
        })}
      </script>
    </Helmet>
  );
}
