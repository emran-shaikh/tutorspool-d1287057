# Multi-currency Display Plan

Your prices today are stored in one base currency (PKR, shown as `Rs`/`/hr` on tutor cards and booking). Goal: show each visitor a price in their local currency automatically, based on region + language.

## Complexity: Low → Medium

- **Display-only conversion** (recommended first step): ~Low. No payment changes, no tutor-side changes.
- **Charging in local currency**: Medium — requires Stripe multi-currency, payout logic, and tutor payout FX handling. Skip for now unless you ask.

This plan covers **display-only**.

## How it will work

1. **Detect region** on first visit:
   - Primary: Cloudflare `CF-IPCountry` header (free, already in front of the site) OR a lightweight geo API (`ipapi.co` / `ip-api.com`) called once from an Edge Function.
   - Fallback: browser locale (`navigator.language`) → country guess.
   - Combined with the current i18n language (EN/AR/ES) to pick a sensible default:
     - AR → SAR / AED / EGP (by country)
     - ES → EUR / MXN / ARS (by country)
     - EN → USD / GBP / INR / PKR (by country)
2. **Fetch FX rates** daily from a free provider (`exchangerate.host` or `open.er-api.com` — no key). Cache in Firestore `fxRates/{date}` doc; refresh via existing hourly cron.
3. **Currency context** (`src/contexts/CurrencyContext.tsx`) exposes `{ code, symbol, convert(pkr) }`.
4. **Manual override**: currency dropdown next to the language switcher in the Navbar. Persist in `localStorage` (`tp_currency`).
5. **Format prices** via a `<Price amount={pkrValue} />` component wherever `/hr` or booking totals are rendered (tutor cards, tutor profile page, booking page, invoices/emails).
6. **Disclosure**: small "~approx, charged in PKR" tooltip near converted prices to stay honest and avoid chargebacks.

## Scope of file changes

- New: `src/contexts/CurrencyContext.tsx`, `src/components/CurrencySwitcher.tsx`, `src/components/Price.tsx`
- New Edge Function: `supabase/functions/fx-rates/index.ts` (daily fetch + cache)
- Edit: `src/components/layout/Navbar.tsx` (add switcher next to LanguageSwitcher)
- Edit: price render sites — `FindTutors.tsx`, `TutorProfilePage.tsx`, `FeaturedTutors.tsx`, `BookSession.tsx`, booking confirmation email template
- Edit: `src/main.tsx` to wrap app in `CurrencyProvider`
- i18n keys: add `common.approxCharged` string to en/ar/es JSON

## What we're NOT doing (unless you say so)

- Not changing Stripe/Paddle currency — checkout still processes PKR.
- Not converting tutor-entered hourly rate at save time (stored as PKR).
- Not adding per-country pricing tiers (that's a separate product decision).

## Effort estimate

~1 build turn to ship end-to-end. Ongoing: none (rates auto-refresh; adding a new currency = one line).

## Open questions before build

1. Confirm base currency is **PKR** (that's what tutor rates appear to be in) — or is it USD?
2. Should the currency switcher be **auto-only** (locked to detected region) or **user-changeable** via a dropdown? I'd recommend user-changeable.
3. Initial supported list — propose: **USD, GBP, EUR, PKR, INR, SAR, AED, CAD, AUD**. Add/remove?
