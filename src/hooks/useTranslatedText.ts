import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const memCache = new Map<string, string>();

function sessionKey(cacheKey: string, lang: string) {
  return `tp_tx:${lang}:${cacheKey}`;
}

/**
 * Translate arbitrary user-generated text (tutor bios, blog posts, etc.)
 * to the active UI language. Falls back to source text silently.
 */
export function useTranslatedText(source: string | undefined | null, cacheKey: string): string {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";
  const src = (source || "").trim();
  const [text, setText] = useState<string>(src);

  useEffect(() => {
    if (!src || lang.startsWith("en")) {
      setText(src);
      return;
    }
    const mem = memCache.get(`${lang}:${cacheKey}`);
    if (mem) {
      setText(mem);
      return;
    }
    try {
      const cached = sessionStorage.getItem(sessionKey(cacheKey, lang));
      if (cached) {
        memCache.set(`${lang}:${cacheKey}`, cached);
        setText(cached);
        return;
      }
    } catch {}

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("translate-content", {
          body: { text: src, targetLang: lang, cacheKey },
        });
        if (cancelled) return;
        const translated = (data as any)?.translated;
        if (!error && typeof translated === "string" && translated.trim()) {
          memCache.set(`${lang}:${cacheKey}`, translated);
          try {
            sessionStorage.setItem(sessionKey(cacheKey, lang), translated);
          } catch {}
          setText(translated);
        } else {
          setText(src);
        }
      } catch {
        if (!cancelled) setText(src);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, lang, cacheKey]);

  return text;
}
