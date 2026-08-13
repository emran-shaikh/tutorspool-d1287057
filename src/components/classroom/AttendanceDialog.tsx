import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { ClassroomParticipant, getAttendance } from "@/lib/classroom";

interface Props {
  roomId: string | null;
  title?: string;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({ roomId, title, onOpenChange }: Props) {
  const [rows, setRows] = useState<ClassroomParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    getAttendance(roomId)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [roomId]);

  return (
    <Dialog open={!!roomId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Classroom attendance</DialogTitle>
          <DialogDescription>{title || "Who joined this live class and for how long."}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No one has joined this classroom yet.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {rows.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(r.joinedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="capitalize">{r.role}</Badge>
                  <Badge variant="secondary">
                    {r.durationMinutes != null ? `${r.durationMinutes} min` : "In class"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
