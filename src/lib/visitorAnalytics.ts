import { db } from "./firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";

const SESSION_KEY = "tp_visit_session";
const SESSION_DOC_KEY = "tp_visit_doc";
const SESSION_START_KEY = "tp_visit_start";
const LAST_PAGE_KEY = "tp_visit_lastpage";
const LAST_PAGE_TIME_KEY = "tp_visit_lastpage_time";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min inactivity

interface UTM {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

function parseUTM(): UTM {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const utm: UTM = {};
  ["source", "medium", "campaign", "term", "content"].forEach((k) => {
    const v = p.get(`utm_${k}`);
    if (v) (utm as any)[k] = v;
  });
  return utm;
}

function getReferrerCategory(ref: string): string {
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes(window.location.hostname)) return "internal";
    if (/google\.|bing\.|duckduckgo\.|yahoo\.|baidu\./.test(host)) return "search";
    if (/facebook\.|instagram\.|twitter\.|x\.com|linkedin\.|tiktok\.|youtube\.|reddit\.|pinterest\./.test(host))
      return "social";
    if (/whatsapp\.|t\.me|telegram\./.test(host)) return "messaging";
    return "referral";
  } catch {
    return "direct";
  }
}

function getDevice(): { device: string; os: string; browser: string } {
  const ua = navigator.userAgent;
  const device = /Mobi|Android|iPhone|iPad/.test(ua) ? "mobile" : "desktop";
  let os = "unknown";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  let browser = "unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  return { device, os, browser };
}

function dateKey(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

async function startSession(): Promise<string | null> {
  try {
    const utm = parseUTM();
    const ref = document.referrer || "";
    const refCat = getReferrerCategory(ref);
    const dev = getDevice();
    const sessionId = crypto.randomUUID();
    const docRef = await addDoc(collection(db, "visitorSessions"), {
      sessionId,
      startedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      date: dateKey(),
      hour: new Date().getHours(),
      landingPage: window.location.pathname,
      exitPage: window.location.pathname,
      referrer: ref,
      referrerCategory: refCat,
      utmSource: utm.source || null,
      utmMedium: utm.medium || null,
      utmCampaign: utm.campaign || null,
      utmTerm: utm.term || null,
      utmContent: utm.content || null,
      device: dev.device,
      os: dev.os,
      browser: dev.browser,
      language: navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      pageViews: 1,
      durationSec: 0,
      bounced: true,
      ended: false,
    });
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(SESSION_DOC_KEY, docRef.id);
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    sessionStorage.setItem(LAST_PAGE_KEY, window.location.pathname);
    sessionStorage.setItem(LAST_PAGE_TIME_KEY, String(Date.now()));
    return docRef.id;
  } catch (e) {
    console.warn("[analytics] startSession failed", e);
    return null;
  }
}

async function logPageView(sessionDocId: string, path: string) {
  try {
    await addDoc(collection(db, "visitorPageViews"), {
      sessionDocId,
      path,
      title: document.title,
      timestamp: serverTimestamp(),
      date: dateKey(),
      hour: new Date().getHours(),
    });
  } catch (e) {
    console.warn("[analytics] logPageView failed", e);
  }
}

async function updateSessionOnNav(sessionDocId: string, newPath: string) {
  try {
    const start = Number(sessionStorage.getItem(SESSION_START_KEY) || Date.now());
    const duration = Math.round((Date.now() - start) / 1000);
    await updateDoc(doc(db, "visitorSessions", sessionDocId), {
      lastActiveAt: serverTimestamp(),
      exitPage: newPath,
      pageViews: increment(1),
      durationSec: duration,
      bounced: false,
    });
  } catch (e) {
    console.warn("[analytics] updateSession failed", e);
  }
}

async function endSession(sessionDocId: string, exitPath: string) {
  try {
    const start = Number(sessionStorage.getItem(SESSION_START_KEY) || Date.now());
    const duration = Math.round((Date.now() - start) / 1000);
    const payload = JSON.stringify({
      durationSec: duration,
      exitPage: exitPath,
      ended: true,
      endedAt: new Date().toISOString(),
    });
    // best-effort beacon (firestore client may not flush). Also try direct update.
    updateDoc(doc(db, "visitorSessions", sessionDocId), {
      durationSec: duration,
      exitPage: exitPath,
      ended: true,
      lastActiveAt: serverTimestamp(),
    }).catch(() => {});
    // sendBeacon to a noop endpoint is not needed; firestore SDK queues writes.
    void payload;
  } catch (e) {
    console.warn("[analytics] endSession failed", e);
  }
}

export async function trackPageView(path: string) {
  if (typeof window === "undefined") return;
  // Respect opt-out
  if (localStorage.getItem("cookie-consent") === "rejected") return;

  let sessionDocId = sessionStorage.getItem(SESSION_DOC_KEY);
  const lastActive = Number(sessionStorage.getItem(LAST_PAGE_TIME_KEY) || 0);
  const expired = !lastActive || Date.now() - lastActive > SESSION_TTL_MS;

  if (!sessionDocId || expired) {
    sessionDocId = await startSession();
    if (sessionDocId) await logPageView(sessionDocId, path);
  } else {
    await updateSessionOnNav(sessionDocId, path);
    await logPageView(sessionDocId, path);
  }
  sessionStorage.setItem(LAST_PAGE_KEY, path);
  sessionStorage.setItem(LAST_PAGE_TIME_KEY, String(Date.now()));
}

export function attachUnloadHandler() {
  if (typeof window === "undefined") return;
  const handler = () => {
    const id = sessionStorage.getItem(SESSION_DOC_KEY);
    const path = sessionStorage.getItem(LAST_PAGE_KEY) || window.location.pathname;
    if (id) endSession(id, path);
  };
  window.addEventListener("pagehide", handler);
  window.addEventListener("beforeunload", handler);
}
