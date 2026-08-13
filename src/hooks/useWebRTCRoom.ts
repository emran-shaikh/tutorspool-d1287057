import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface RoomPeer {
  uid: string;
  name: string;
  role: "tutor" | "student" | "admin";
  stream?: MediaStream;
  micOn: boolean;
  camOn: boolean;
}

export interface RoomEvent {
  type: "chat" | "stroke" | "clear" | "end" | "force-mute";
  payload: any;
  from: string;
}

interface Options {
  roomId: string;
  uid: string;
  name: string;
  role: "tutor" | "student" | "admin";
  publishVideo: boolean;
  onEvent?: (e: RoomEvent) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

// Enable a TURN relay later by setting these Vite env vars.
const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
if (turnUrl) {
  ICE_SERVERS.push({
    urls: turnUrl,
    username: import.meta.env.VITE_TURN_USERNAME as string | undefined,
    credential: import.meta.env.VITE_TURN_CREDENTIAL as string | undefined,
  });
}

export function useWebRTCRoom({ roomId, uid, name, role, publishVideo, onEvent }: Options) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RoomPeer>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(publishVideo);
  const [sharing, setSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const stateRef = useRef({ micOn: true, camOn: publishVideo });
  stateRef.current = { micOn, camOn };

  const send = useCallback((event: string, payload: any) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const createPeer = useCallback(
    (peerId: string) => {
      if (pcsRef.current[peerId]) return pcsRef.current[peerId];
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcsRef.current[peerId] = pc;

      localRef.current?.getTracks().forEach(t => pc.addTrack(t, localRef.current!));

      pc.onicecandidate = e => {
        if (e.candidate) {
          send("signal", { from: uid, to: peerId, kind: "ice", data: e.candidate.toJSON() });
        }
      };
      pc.ontrack = e => {
        const [stream] = e.streams;
        setPeers(prev => ({
          ...prev,
          [peerId]: { ...(prev[peerId] || { uid: peerId, name: "Guest", role: "student", micOn: true, camOn: true }), stream },
        }));
      };
      return pc;
    },
    [send, uid]
  );

  const callPeer = useCallback(
    async (peerId: string) => {
      const pc = createPeer(peerId);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      send("signal", { from: uid, to: peerId, kind: "offer", data: offer });
    },
    [createPeer, send, uid]
  );

  const cleanupPeer = useCallback((peerId: string) => {
    pcsRef.current[peerId]?.close();
    delete pcsRef.current[peerId];
    setPeers(prev => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // ---- media + signalling lifecycle ----
  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: publishVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localRef.current = stream;
        setLocalStream(stream);
      } catch {
        if (!cancelled) setMediaError("We couldn't access your camera or microphone. You can still watch, chat and use the whiteboard.");
      }

      if (cancelled) return;

      channel = supabase.channel(`classroom:${roomId}`, {
        config: { presence: { key: uid }, broadcast: { self: false } },
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState() as Record<string, any[]>;
          const present: Record<string, RoomPeer> = {};
          Object.entries(state).forEach(([key, metas]) => {
            if (key === uid) return;
            const meta = metas[0] || {};
            present[key] = {
              uid: key,
              name: meta.name || "Guest",
              role: meta.role || "student",
              micOn: meta.micOn ?? true,
              camOn: meta.camOn ?? true,
              stream: undefined,
            };
          });
          setPeers(prev => {
            const next: Record<string, RoomPeer> = {};
            Object.keys(present).forEach(id => {
              next[id] = { ...present[id], stream: prev[id]?.stream };
            });
            Object.keys(prev).forEach(id => {
              if (!next[id]) pcsRef.current[id]?.close(), delete pcsRef.current[id];
            });
            return next;
          });
          // Deterministic caller: the lexicographically smaller uid offers.
          Object.keys(present).forEach(peerId => {
            if (uid < peerId && !pcsRef.current[peerId]) void callPeer(peerId);
          });
        })
        .on("presence", { event: "leave" }, ({ key }: any) => cleanupPeer(key))
        .on("broadcast", { event: "signal" }, async ({ payload }: any) => {
          if (payload.to !== uid) return;
          const pc = createPeer(payload.from);
          if (payload.kind === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send("signal", { from: uid, to: payload.from, kind: "answer", data: answer });
          } else if (payload.kind === "answer") {
            if (pc.signalingState !== "stable") {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.data));
            }
          } else if (payload.kind === "ice") {
            await pc.addIceCandidate(new RTCIceCandidate(payload.data)).catch(() => undefined);
          }
        })
        .on("broadcast", { event: "room" }, ({ payload }: any) => {
          onEventRef.current?.(payload as RoomEvent);
        })
        .subscribe(async status => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            await channel!.track({ name, role, micOn: stateRef.current.micOn, camOn: stateRef.current.camOn });
          }
        });
    })();

    return () => {
      cancelled = true;
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcsRef.current = {};
      localRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current?.getTracks().forEach(t => t.stop());
      localRef.current = null;
      if (channel) supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, uid, publishVideo]);

  const updatePresence = useCallback(
    (patch: Partial<{ micOn: boolean; camOn: boolean }>) => {
      channelRef.current?.track({
        name,
        role,
        micOn: patch.micOn ?? stateRef.current.micOn,
        camOn: patch.camOn ?? stateRef.current.camOn,
      });
    },
    [name, role]
  );

  const toggleMic = useCallback(() => {
    const next = !stateRef.current.micOn;
    localRef.current?.getAudioTracks().forEach(t => (t.enabled = next));
    setMicOn(next);
    updatePresence({ micOn: next });
  }, [updatePresence]);

  const toggleCam = useCallback(() => {
    const next = !stateRef.current.camOn;
    localRef.current?.getVideoTracks().forEach(t => (t.enabled = next));
    setCamOn(next);
    updatePresence({ camOn: next });
  }, [updatePresence]);

  const replaceOutgoingVideo = useCallback((track: MediaStreamTrack | null) => {
    Object.values(pcsRef.current).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      if (sender && track) void sender.replaceTrack(track);
    });
  }, []);

  const toggleShare = useCallback(async () => {
    if (sharing) {
      screenRef.current?.getTracks().forEach(t => t.stop());
      screenRef.current = null;
      const camTrack = localRef.current?.getVideoTracks()[0] || null;
      replaceOutgoingVideo(camTrack);
      setSharing(false);
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenRef.current = display;
      const track = display.getVideoTracks()[0];
      track.onended = () => {
        screenRef.current = null;
        replaceOutgoingVideo(localRef.current?.getVideoTracks()[0] || null);
        setSharing(false);
      };
      replaceOutgoingVideo(track);
      setSharing(true);
    } catch {
      /* user cancelled */
    }
  }, [sharing, replaceOutgoingVideo]);

  const broadcast = useCallback(
    (type: RoomEvent["type"], payload: any) => {
      send("room", { type, payload, from: uid });
    },
    [send, uid]
  );

  const forceMuteSelf = useCallback(() => {
    localRef.current?.getAudioTracks().forEach(t => (t.enabled = false));
    setMicOn(false);
    updatePresence({ micOn: false });
  }, [updatePresence]);

  const peerList = useMemo(() => Object.values(peers), [peers]);
  const screenStream = sharing ? screenRef.current : null;

  return {
    localStream,
    screenStream,
    peers: peerList,
    micOn,
    camOn,
    sharing,
    connected,
    mediaError,
    toggleMic,
    toggleCam,
    toggleShare,
    broadcast,
    forceMuteSelf,
  };
}
