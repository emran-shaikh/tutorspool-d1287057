import { useState } from "react";

function formatBuildTime(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
    return `${day} ${month} ${time} UTC`;
  } catch {
    return "unknown";
  }
}

export function BuildBadge() {
  const [open, setOpen] = useState(false);
  const buildTime = __BUILD_TIME__;
  const label = formatBuildTime(buildTime);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      title="Build version — click to copy"
      className="hidden sm:flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-expanded={open}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      <span className="tabular-nums">{label}</span>
    </button>
  );
}
