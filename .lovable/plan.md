

## Plan: Auto-Hide Voice Agent When ElevenLabs Credits Are Exhausted

### Approach

Create a new edge function `elevenlabs-check-credits` that pings the ElevenLabs API to verify credit availability. The `VoiceAgent` component will call this on mount (and periodically) to determine visibility. When credits are exhausted, the component hides itself entirely. When credits reset, it reappears automatically.

### Detection Strategy

The ElevenLabs free plan doesn't expose a direct "credits remaining" API. Instead, we'll use the existing signed URL endpoint as a health check — if it returns a quota error, credits are exhausted. If it succeeds, credits are available. This avoids needing any new API.

### Changes

**1. New edge function: `supabase/functions/elevenlabs-check-credits/index.ts`**
- Lightweight function that hits the ElevenLabs signed URL endpoint
- Returns `{ has_credits: true/false }`
- Reuses the same quota detection logic from the token function
- No signed URL is wasted — we just check if the API responds successfully

**2. Update `src/components/VoiceAgent.tsx`**
- Add `hasCredits` state (default `true` to avoid flash-hiding on load)
- On mount, call `elevenlabs-check-credits` to check availability
- Re-check every 5 minutes via `setInterval` so when credits reset, button reappears
- Also set `hasCredits = false` when a quota error is detected during `startConversation` (existing logic) or when session disconnects within 3 seconds (immediate disconnect = no credits)
- If `hasCredits` is `false`, return `null` — component is fully hidden
- Console messages: log when hiding (`🚫 Voice agent hidden: credits exhausted`) and when restoring (`✅ Voice agent restored: credits available`)

**3. Update `supabase/config.toml`** — not needed, config is auto-managed.

### Flow

```text
Mount → check-credits → has_credits?
  ├─ true  → show button, re-check in 5 min
  └─ false → hide button, log to console, re-check in 5 min
                                ↓
                        credits reset → next check returns true → show button again
```

### Immediate Disconnect Detection

When the session connects but disconnects within 3 seconds (the pattern you're seeing), we'll also mark `hasCredits = false` and hide the button — since this is the telltale sign of exhausted free plan credits even when the signed URL succeeded.

