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
  type: "chat" | "stroke" | "clear" | "end" | "force-mute" | "remove";
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

// Optional TURN relay for strict/corporate networks.
// VITE_TURN_URL may hold one or more comma-separated URLs.
const buildIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const raw = (import.meta.env.VITE_TURN_URL as string | undefined)?.trim();
  if (raw) {
    const urls = raw
      .split(",")
      .map(u => u.trim())
      .filter(Boolean);
    if (urls.length) {
      servers.push({
        urls,
        username: import.meta.env.VITE_TURN_USERNAME as string | undefined,
        credential: import.meta.env.VITE_TURN_CREDENTIAL as string | undefined,
      });
    }
  }
  return servers;
};

const ICE_SERVERS = buildIceServers();
export const hasTurn = ICE_SERVERS.length > 1;

// ---- Audio quality tuning -------------------------------------------------
// Clean, intelligible speech on weak networks: browser DSP on, mono 48 kHz.
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 48000,
  sampleSize: 16,
};

// Opus tuning: in-band FEC + DTX so packet loss and silence cost less bandwidth,
// with a bitrate floor/ceiling that stays clear even on slow mobile links.
const tuneOpus = (sdp: string): string => {
  const opusPt = sdp.match(/a=rtpmap:(\d+) opus\/48000/i)?.[1];
  if (!opusPt) return sdp;
  const wanted = [
    "stereo=0",
    "sprop-stereo=0",
    "useinbandfec=1",
    "usedtx=1",
    "maxaveragebitrate=40000",
    "maxplaybackrate=48000",
    "cbr=0",
  ];
  const fmtpRe = new RegExp(`a=fmtp:${opusPt} (.*)`);
  if (fmtpRe.test(sdp)) {
    sdp = sdp.replace(fmtpRe, (_m, params: string) => {
      const kept = params
        .split(";")
        .map(p => p.trim())
        .filter(p => p && !wanted.some(w => p.startsWith(w.split("=")[0] + "=")));
      return `a=fmtp:${opusPt} ${[...kept, ...wanted].join(";")}`;
    });
  } else {
    sdp = sdp.replace(
      new RegExp(`(a=rtpmap:${opusPt} opus/48000/2\\r?\\n)`),
      `$1a=fmtp:${opusPt} ${wanted.join(";")}\r\n`
    );
  }
  // 20 ms packets keep latency low without extra overhead.
  if (!/a=ptime:/.test(sdp)) {
    sdp = sdp.replace(new RegExp(`(a=fmtp:${opusPt} .*\\r?\\n)`), `$1a=ptime:20\r\na=maxptime:60\r\n`);
  }
  return sdp;
};

// Audio always wins the bandwidth race; video degrades first.
const prioritiseAudio = (pc: RTCPeerConnection) => {
  pc.getSenders().forEach(sender => {
    if (!sender.track) return;
    const params = sender.getParameters();
    if (!params.encodings || !params.encodings.length) params.encodings = [{}];
    if (sender.track.kind === "audio") {
      params.encodings[0].maxBitrate = 40000;
      (params.encodings[0] as any).networkPriority = "high";
      (params.encodings[0] as any).priority = "high";
    } else {
      params.encodings[0].maxBitrate = 900000;
      (params as any).degradationPreference = "balanced";
      (params.encodings[0] as any).networkPriority = "low";
    }
    sender.setParameters(params).catch(() => undefined);
  });
};



export function useWebRTCRoom({ roomId, uid, name, role, publishVideo, onEvent }: Options) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<string, RoomPeer>>({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(publishVideo);
  const [sharing, setSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const [removed, setRemoved] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const blockedRef = useRef<Set<string>>(new Set());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const stateRef = useRef({ micOn: true, camOn: publishVideo });
  stateRef.current = { micOn, camOn };

  const send = useCallback((event: string, payload: any) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const cleanupPeer = useCallback((peerId: string) => {
    pcsRef.current[peerId]?.close();
    delete pcsRef.current[peerId];
    setPeers(prev => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  const callPeerRef = useRef<(peerId: string, iceRestart?: boolean) => Promise<void>>();

  const createPeer = useCallback(
    (peerId: string) => {
      if (pcsRef.current[peerId]) return pcsRef.current[peerId];
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcsRef.current[peerId] = pc;

      localRef.current?.getTracks().forEach(t => pc.addTrack(t, localRef.current!));
      prioritiseAudio(pc);


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
      // Recover from temporary network drops: the deterministic caller re-offers
      // with an ICE restart instead of leaving a dead connection behind.
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          if (blockedRef.current.has(peerId)) return;
          window.setTimeout(() => {
            const current = pcsRef.current[peerId];
            if (!current || current !== pc) return;
            if (current.connectionState === "connected") return;
            if (uid < peerId) void callPeerRef.current?.(peerId, true);
          }, 2000);
        }
      };
      return pc;
    },
    [send, uid]
  );

  const callPeer = useCallback(
    async (peerId: string, iceRestart = false) => {
      const pc = createPeer(peerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart,
      });
      const tuned = { type: offer.type, sdp: tuneOpus(offer.sdp || "") } as RTCSessionDescriptionInit;
      await pc.setLocalDescription(tuned);
      prioritiseAudio(pc);
      send("signal", { from: uid, to: peerId, kind: "offer", data: tuned });
    },
    [createPeer, send, uid]
  );
  callPeerRef.current = callPeer;



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
            if (key === uid || blockedRef.current.has(key)) return;
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
          if (blockedRef.current.has(payload.from)) return;
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
          const e = payload as RoomEvent;
          if (e.type === "remove" && e.payload?.uid === uid) {
            setRemoved(true);
          }
          onEventRef.current?.(e);
        })
        .subscribe(async status => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            // A resubscribe means we dropped and came back: tell consumers to resync.
            setReconnectNonce(n => n + 1);
            await channel!.track({ name, role, micOn: stateRef.current.micOn, camOn: stateRef.current.camOn });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setConnected(false);
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

  // Host-side: stop rendering/negotiating with a removed participant.
  const blockPeer = useCallback(
    (peerId: string) => {
      blockedRef.current.add(peerId);
      cleanupPeer(peerId);
    },
    [cleanupPeer]
  );

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
    reconnectNonce,
    removed,
    hasTurn,
    mediaError,
    toggleMic,
    toggleCam,
    toggleShare,
    blockPeer,
    broadcast,

    forceMuteSelf,
  };
}
