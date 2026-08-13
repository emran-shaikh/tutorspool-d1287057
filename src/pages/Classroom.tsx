import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWebRTCRoom, RoomEvent } from "@/hooks/useWebRTCRoom";
import { VideoTile } from "@/components/classroom/VideoTile";
import { Whiteboard } from "@/components/classroom/Whiteboard";
import { ChatPanel } from "@/components/classroom/ChatPanel";
import { ControlBar } from "@/components/classroom/ControlBar";
import {
  ClassroomMessage,
  RoomAccess,
  WhiteboardStroke,
  clearBoard,
  endRoom,
  ensureRoom,
  getMessages,
  getStrokes,
  parseRoomId,
  recordJoin,
  recordLeave,
  resolveRoomAccess,
  saveMessage,
  saveStroke,
} from "@/lib/classroom";
import { MessageSquare, Users, Loader2, AlertTriangle, Radio } from "lucide-react";

type Tab = "people" | "chat";

export default function Classroom() {
  const { roomId = "" } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [access, setAccess] = useState<RoomAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [boardOn, setBoardOn] = useState(false);
  const [studentsCanDraw, setStudentsCanDraw] = useState(false);
  const [tab, setTab] = useState<Tab>("people");
  const attendanceRef = useRef<{ id: string; joinedAt: string } | null>(null);

  const uid = user?.uid || "";
  const name = userProfile?.fullName || "Guest";
  const role = (userProfile?.role as "tutor" | "student" | "admin") || "student";

  // ---- access + initial data ----
  useEffect(() => {
    if (!uid || !userProfile) return;
    let cancelled = false;
    (async () => {
      const result = await resolveRoomAccess(roomId, uid, role);
      if (cancelled) return;
      setAccess(result);
      if (result.allowed) {
        const parsed = parseRoomId(roomId)!;
        await ensureRoom(roomId, {
          kind: parsed.kind,
          refId: parsed.refId,
          tutorId: result.tutorId,
          title: result.title,
        }).catch(() => undefined);
        const [msgs, board, attendanceId] = await Promise.all([
          getMessages(roomId).catch(() => []),
          getStrokes(roomId).catch(() => []),
          recordJoin({ roomId, uid, name, role }).catch(() => ""),
        ]);
        if (cancelled) return;
        setMessages(msgs);
        setStrokes(board);
        if (attendanceId) attendanceRef.current = { id: attendanceId, joinedAt: new Date().toISOString() };
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, uid, userProfile]);

  // ---- attendance close-out ----
  useEffect(() => {
    const close = () => {
      const a = attendanceRef.current;
      if (a) {
        attendanceRef.current = null;
        void recordLeave(a.id, a.joinedAt);
      }
    };
    window.addEventListener("beforeunload", close);
    return () => {
      window.removeEventListener("beforeunload", close);
      close();
    };
  }, []);

  const handleEvent = useCallback(
    (e: RoomEvent) => {
      if (e.type === "chat") {
        setMessages(prev => [...prev, e.payload as ClassroomMessage]);
      } else if (e.type === "stroke") {
        setStrokes(prev => [...prev, e.payload as WhiteboardStroke]);
        setBoardOn(true);
      } else if (e.type === "clear") {
        setStrokes([]);
      } else if (e.type === "end") {
        toast({ title: "Class ended", description: "The tutor ended this class." });
        navigate(-1);
      } else if (e.type === "force-mute" && e.payload?.uid === uid) {
        forceMuteSelfRef.current?.();
        toast({ title: "You were muted by the tutor" });
      }
    },
    [navigate, toast, uid]
  );

  const isHost = !!access?.isHost;
  const canPublishVideo = access?.canPublishVideo ?? false;

  const room = useWebRTCRoom({
    roomId,
    uid,
    name,
    role,
    publishVideo: !loading && !!access?.allowed && canPublishVideo,
    onEvent: handleEvent,
  });

  const forceMuteSelfRef = useRef<() => void>();
  forceMuteSelfRef.current = room.forceMuteSelf;

  // ---- actions ----
  const sendChat = (text: string) => {
    const msg: ClassroomMessage = {
      roomId,
      uid,
      name,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    room.broadcast("chat", msg);
    void saveMessage(msg).catch(() => undefined);
  };

  const addStroke = (s: Omit<WhiteboardStroke, "id" | "roomId" | "uid">) => {
    const stroke: WhiteboardStroke = { ...s, roomId, uid };
    setStrokes(prev => [...prev, stroke]);
    room.broadcast("stroke", stroke);
    void saveStroke(stroke).catch(() => undefined);
  };

  const clearAll = () => {
    setStrokes([]);
    room.broadcast("clear", {});
    void clearBoard(roomId).catch(() => undefined);
  };

  const leave = async () => {
    const a = attendanceRef.current;
    attendanceRef.current = null;
    if (a) await recordLeave(a.id, a.joinedAt).catch(() => undefined);
    navigate(-1);
  };

  const endForAll = async () => {
    room.broadcast("end", {});
    await endRoom(roomId).catch(() => undefined);
    await leave();
  };

  const hostStream = useMemo(() => {
    if (isHost) return room.screenStream || room.localStream;
    const host = room.peers.find(p => p.role === "tutor" || p.uid === access?.tutorId);
    return host?.stream || null;
  }, [isHost, room.screenStream, room.localStream, room.peers, access?.tutorId]);

  const hostName = isHost ? `${name} (you)` : room.peers.find(p => p.uid === access?.tutorId)?.name || "Tutor";

  if (!user || !userProfile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!access?.allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center">
        <AlertTriangle className="h-10 w-10 text-primary" />
        <h1 className="text-xl font-display font-bold text-white">Classroom unavailable</h1>
        <p className="max-w-md text-sm text-slate-400">{access?.reason}</p>
        <Button asChild variant="secondary">
          <Link to="/">Back to TutorsPool</Link>
        </Button>
      </div>
    );
  }

  const canDraw = isHost || studentsCanDraw || role === "admin";

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-900 text-slate-100 flex flex-col">
      <Helmet>
        <title>Live Classroom | TutorsPool</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-display text-lg font-bold">
            Tutors<span className="text-primary">Pool</span>
          </span>
          <span className="truncate text-sm text-slate-400">{access.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Radio className={`h-3 w-3 ${room.connected ? "text-emerald-500" : "text-amber-500"}`} />
            {room.connected ? "Live" : "Connecting"}
          </Badge>
          {isHost && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setStudentsCanDraw(v => !v)}>
                {studentsCanDraw ? "Lock board" : "Let students draw"}
              </Button>
              <Button size="sm" variant="destructive" onClick={endForAll}>
                End class
              </Button>
            </>
          )}
        </div>
      </header>

      {room.mediaError && (
        <p className="bg-amber-500/15 px-4 py-1.5 text-xs text-amber-300">{room.mediaError}</p>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row gap-3 p-3">
        {/* Stage */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-800">
            {boardOn ? (
              <Whiteboard
                strokes={strokes}
                canDraw={canDraw && !isMobile}
                onStroke={addStroke}
                onClear={isHost ? clearAll : undefined}
              />
            ) : (
              <VideoTile
                stream={hostStream}
                name={hostName}
                muted={isHost}
                micOn
                camOn={isHost ? room.camOn || room.sharing : true}
                className="h-full w-full"
                large
              />
            )}
          </div>

          <ControlBar
            micOn={room.micOn}
            camOn={room.camOn}
            sharing={room.sharing}
            boardOn={boardOn}
            canPublishVideo={canPublishVideo}
            canShare={canPublishVideo}
            onToggleMic={room.toggleMic}
            onToggleCam={room.toggleCam}
            onToggleShare={room.toggleShare}
            onToggleBoard={() => setBoardOn(v => !v)}
            onLeave={leave}
          />
        </div>

        {/* Side rail */}
        <aside className="flex w-full lg:w-80 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setTab("people")}
              className={`flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ${
                tab === "people" ? "text-primary border-b-2 border-primary" : "text-slate-400"
              }`}
            >
              <Users className="h-4 w-4" /> People ({room.peers.length + 1})
            </button>
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 py-2 text-sm flex items-center justify-center gap-1.5 ${
                tab === "chat" ? "text-primary border-b-2 border-primary" : "text-slate-400"
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
          </div>

          {tab === "people" ? (
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
              <VideoTile
                stream={room.localStream}
                name={`${name} (you)`}
                muted
                micOn={room.micOn}
                camOn={room.camOn}
                className="aspect-video w-full"
              />
              {room.peers.map(p => (
                <div key={p.uid} className="space-y-1">
                  <VideoTile
                    stream={p.stream}
                    name={p.name}
                    micOn={p.micOn}
                    camOn={p.camOn}
                    className="aspect-video w-full"
                  />
                  {isHost && p.micOn && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-full text-xs text-slate-400"
                      onClick={() => room.broadcast("force-mute", { uid: p.uid })}
                    >
                      Mute {p.name.split(" ")[0]}
                    </Button>
                  )}
                </div>
              ))}
              {room.peers.length === 0 && (
                <p className="p-2 text-xs text-slate-400">Waiting for others to join…</p>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1">
              <ChatPanel messages={messages} myUid={uid} onSend={sendChat} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
