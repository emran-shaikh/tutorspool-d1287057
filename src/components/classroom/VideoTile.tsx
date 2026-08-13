import { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";

interface Props {
  stream?: MediaStream | null;
  name: string;
  muted?: boolean;
  micOn?: boolean;
  camOn?: boolean;
  className?: string;
  large?: boolean;
}

export function VideoTile({ stream, name, muted, micOn = true, camOn = true, className, large }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const initials = name
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-800 border border-white/10 ${className || ""}`}
    >
      {stream && camOn ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-300">
          <div
            className={`rounded-full bg-slate-700 flex items-center justify-center font-semibold ${
              large ? "h-20 w-20 text-2xl" : "h-12 w-12 text-sm"
            }`}
          >
            {initials || "?"}
          </div>
          {!camOn && <VideoOff className="h-4 w-4 opacity-60" />}
        </div>
      )}

      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-2">
        <span className="truncate rounded bg-black/55 px-2 py-0.5 text-xs text-white">{name}</span>
        {!micOn && (
          <span className="rounded-full bg-destructive p-1">
            <MicOff className="h-3 w-3 text-white" />
          </span>
        )}
      </div>
    </div>
  );
}
