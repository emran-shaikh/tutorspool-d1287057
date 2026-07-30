import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";

/**
 * Multi-currency display context.
 * Base currency is USD (all tutor.hourlyRate values are stored in USD).
 * Rates are fetched from open.er-api.com (no key) and cached for 24h in localStorage.
 * Actual checkout is still processed in USD — this is display-only.
 */

export type CurrencyCode =
  | "USD" | "GBP" | "EUR" | "PKR" | "INR"
  | "SAR" | "AED" | "CAD" | "AUD" | "EGP" | "MXN";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "USD", symbol: "$",    label: "US Dollar",       flag: "🇺🇸" },
  { code: "GBP", symbol: "£",    label: "British Pound",   flag: "🇬🇧" },
  { code: "EUR", symbol: "€",    label: "Euro",            flag: "🇪🇺" },
  { code: "PKR", symbol: "Rs",   label: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "INR", symbol: "₹",    label: "Indian Rupee",    flag: "🇮🇳" },
  { code: "SAR", symbol: "SAR",  label: "Saudi Riyal",     flag: "🇸🇦" },
  { code: "AED", symbol: "AED",  label: "UAE Dirham",      flag: "🇦🇪" },
  { code: "CAD", symbol: "C$",   label: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$",   label: "Australian Dollar", flag: "🇦🇺" },
  { code: "EGP", symbol: "E£",   label: "Egyptian Pound",  flag: "🇪🇬" },
  { code: "MXN", symbol: "MX$",  label: "Mexican Peso",    flag: "🇲🇽" },
];

// Country ISO code → preferred currency
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD", GB: "GBP", UK: "GBP",
  IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", PT: "EUR", BE: "EUR", AT: "EUR", GR: "EUR",
  PK: "PKR", IN: "INR",
  SA: "SAR", AE: "AED", QA: "SAR", KW: "SAR", OM: "SAR", BH: "SAR",
  CA: "CAD", AU: "AUD", NZ: "AUD",
  EG: "EGP", MX: "MXN",
};

// Fallback by i18n language when geo detection fails
const LANG_TO_CURRENCY: Record<string, CurrencyCode> = {
  en: "USD",
  ar: "SAR",
  es: "EUR",
};

// Currency → its home locale, so formatting matches local convention
// (symbol placement, separators, spacing) when the UI language has no region.
const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  USD: "en-US", GBP: "en-GB", EUR: "de-DE", PKR: "en-PK", INR: "en-IN",
  SAR: "ar-SA", AED: "ar-AE", CAD: "en-CA", AUD: "en-AU", EGP: "ar-EG", MXN: "es-MX",
};

// Minor-unit precision per currency (all supported ones use 2 today, but
// large/low-value currencies read better without decimals).
const CURRENCY_DECIMALS: Partial<Record<CurrencyCode, number>> = {
  USD: 2, GBP: 2, EUR: 2, INR: 2, SAR: 2, AED: 2, CAD: 2, AUD: 2, MXN: 2,
  PKR: 0, EGP: 0,
};

const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

/** Prefer the UI language, but keep the currency's regional conventions. */
function resolveLocale(lang: string, currency: CurrencyCode): string {
  const home = CURRENCY_LOCALE[currency] || "en-US";
  const region = home.split("-")[1];
  const candidate = region ? `${lang}-${region}` : lang;
  try {
    const [resolved] = Intl.NumberFormat.supportedLocalesOf([candidate]);
    if (resolved) return resolved;
  } catch { /* ignore */ }
  return home;
}

interface FxCache {
  base: "USD";
  rates: Partial<Record<CurrencyCode, number>>;
  fetchedAt: number;
}

const FX_CACHE_KEY = "tp_fx_rates_v1";
const CURRENCY_PREF_KEY = "tp_currency";
const GEO_CACHE_KEY = "tp_geo_country";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function fetchRates(): Promise<FxCache | null> {
  try {
    const cached = localStorage.getItem(FX_CACHE_KEY);
    if (cached) {
      const parsed: FxCache = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < ONE_DAY_MS) return parsed;
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("fx fetch failed");
    const data = await res.json();
    const rates: FxCache["rates"] = {};
    for (const c of SUPPORTED_CURRENCIES) {
      const r = data?.rates?.[c.code];
      if (typeof r === "number") rates[c.code] = r;
    }
    rates.USD = 1;
    const payload: FxCache = { base: "USD", rates, fetchedAt: Date.now() };
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(payload));
    return payload;
  } catch (e) {
    console.warn("[currency] rate fetch failed, falling back to USD only", e);
    return { base: "USD", rates: { USD: 1 }, fetchedAt: Date.now() };
  }
}

async function detectCountry(): Promise<string | null> {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) return cached;
  } catch { /* ignore */ }
  try {
    const res = await fetch("https://ipapi.co/country/", { cache: "force-cache" });
    if (!res.ok) return null;
    const country = (await res.text()).trim().toUpperCase();
    if (country && country.length === 2) {
      try { localStorage.setItem(GEO_CACHE_KEY, country); } catch { /* ignore */ }
      return country;
    }
  } catch { /* ignore */ }
  return null;
}

interface CurrencyContextValue {
  code: CurrencyCode;
  meta: CurrencyMeta;
  setCurrency: (code: CurrencyCode) => void;
  /** Convert a USD amount to the current display currency. */
  convert: (usd: number) => number;
  /** Formatted string, e.g. "£24" or "Rs 6,700". */
  format: (usd: number, opts?: { withCurrency?: boolean }) => string;
  ready: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [code, setCode] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<FxCache["rates"]>({ USD: 1 });
  const [ready, setReady] = useState(false);

  // One-time init: load rates, detect currency (respecting user override)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [fx, country] = await Promise.all([fetchRates(), detectCountry()]);
      if (cancelled) return;
      if (fx) setRates(fx.rates);

      let chosen: CurrencyCode = "USD";
      try {
        const saved = localStorage.getItem(CURRENCY_PREF_KEY) as CurrencyCode | null;
        if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
          chosen = saved;
        } else if (country && COUNTRY_TO_CURRENCY[country]) {
          chosen = COUNTRY_TO_CURRENCY[country];
        } else {
          chosen = LANG_TO_CURRENCY[i18n.language?.slice(0, 2) || "en"] || "USD";
        }
      } catch {
        chosen = LANG_TO_CURRENCY[i18n.language?.slice(0, 2) || "en"] || "USD";
      }
      // Only use a currency if we actually have a rate for it, else fall back to USD
      if (!(fx?.rates?.[chosen])) chosen = "USD";
      setCode(chosen);
      setReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = (next: CurrencyCode) => {
    setCode(next);
    try { localStorage.setItem(CURRENCY_PREF_KEY, next); } catch { /* ignore */ }
  };

  const value = useMemo<CurrencyContextValue>(() => {
    const meta = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
    const rate = rates[code] ?? 1;
    const convert = (usd: number) => usd * rate;

    const lang = (i18n.language || "en").slice(0, 2);
    const locale = resolveLocale(lang, code);
    const decimals = CURRENCY_DECIMALS[code] ?? 2;
    const isRtl = RTL_LANGS.has(lang);

    const makeFormatter = (min: number, max: number, display: "narrowSymbol" | "symbol") =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay: display,
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      });

    const format = (usd: number, opts?: { withCurrency?: boolean }) => {
      const amount = convert(usd || 0);
      // Whole units for large amounts / zero-decimal currencies, otherwise the
      // currency's natural precision.
      const useDecimals = decimals > 0 && Math.abs(amount) < 1000;
      const min = useDecimals ? decimals : 0;
      const max = useDecimals ? decimals : 0;

      let out: string;
      try {
        out = makeFormatter(min, max, "narrowSymbol").format(amount);
      } catch {
        try {
          out = makeFormatter(min, max, "symbol").format(amount);
        } catch {
          const rounded = useDecimals
            ? amount.toFixed(decimals)
            : Math.round(amount).toLocaleString(locale);
          out = `${meta.symbol}${rounded}`;
        }
      }

      if (opts?.withCurrency && !out.includes(code)) out = `${out} ${code}`;
      // Isolate the money run so a LTR-shaped amount doesn't reorder inside RTL text.
      return isRtl ? `\u2068${out}\u2069` : out;
    };

    return { code, meta, setCurrency, convert, format, ready };
  }, [code, rates, ready, i18n.language]);


  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
