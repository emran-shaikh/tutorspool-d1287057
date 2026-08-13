import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Presentation,
} from "lucide-react";

interface Props {
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  boardOn: boolean;
  canPublishVideo: boolean;
  canShare: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleShare: () => void;
  onToggleBoard: () => void;
  onLeave: () => void;
}

export function ControlBar({
  micOn,
  camOn,
  sharing,
  boardOn,
  canPublishVideo,
  canShare,
  onToggleMic,
  onToggleCam,
  onToggleShare,
  onToggleBoard,
  onLeave,
}: Props) {
  const base = "h-12 w-12 rounded-full";
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <Button
        variant={micOn ? "secondary" : "destructive"}
        size="icon"
        className={base}
        onClick={onToggleMic}
        aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      {canPublishVideo && (
        <Button
          variant={camOn ? "secondary" : "destructive"}
          size="icon"
          className={base}
          onClick={onToggleCam}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
        >
          {camOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
      )}

      {canShare && (
        <Button
          variant={sharing ? "default" : "secondary"}
          size="icon"
          className={base}
          onClick={onToggleShare}
          aria-label={sharing ? "Stop screen share" : "Share your screen"}
        >
          <MonitorUp className="h-5 w-5" />
        </Button>
      )}

      <Button
        variant={boardOn ? "default" : "secondary"}
        size="icon"
        className={base}
        onClick={onToggleBoard}
        aria-label={boardOn ? "Hide whiteboard" : "Show whiteboard"}
      >
        <Presentation className="h-5 w-5" />
      </Button>

      <Button
        variant="destructive"
        size="icon"
        className={base}
        onClick={onLeave}
        aria-label="Leave classroom"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
