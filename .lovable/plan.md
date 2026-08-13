# TutorsPool Classroom (in-house live class)

Build our own browser-based classroom — video, audio, whiteboard, screen share and chat — instead of sending students to Zoom. Zoom stays available as a fallback; every session simply gains a "Join TutorsPool Classroom" option.

## What the user sees

A full-screen classroom at `/classroom/:roomId` matching the attached mockup:

- Large centre stage: the tutor's video, their shared screen, or the whiteboard
- Right column: participant video tiles with mute indicators
- Bottom bar: mic, camera, screen share, whiteboard toggle, leave
- Left rail: room info, participants, chat, whiteboard tools (tutor-only tools where appropriate)
- Whiteboard: pen, colours, eraser, shapes, clear — drawn strokes sync live to everyone
- Chat panel with text messages during the class
- Tutor controls: mute a participant, end class for all

Access rules: the tutor who owns the session, plus students booked into that 1:1 session or subscribed (active) to that group package. Everyone else sees "You don't have access to this class."

Attendance is logged automatically: who joined, when, and how long. Visible to the tutor on the session and to admin in session monitoring.

## Honest constraints

Real-time video in the browser uses WebRTC, which is a web standard — no Zoom/Agora/Daily account needed. Two supporting pieces are still required and cannot be avoided:

- **Signalling** (peers exchanging connection info): handled by our own backend realtime channel, no external vendor.
- **TURN relay** (needed when a participant is behind a strict corporate/mobile network, roughly 10-20% of users): this needs a relay server. Free public STUN covers the majority; without a TURN credential a minority of users will fail to connect. Options: add TURN credentials later, or self-host coturn.

Peer-to-peer mesh video is comfortable up to about 6 simultaneous cameras. Group classes above that should run "tutor camera on, students audio + chat", which the room will enforce automatically based on participant count.

## Build steps

1. **Room data model** (Firestore): `classrooms` (roomId, sessionId or groupSessionId, tutorId, status, createdAt, endedAt), `classroomParticipants` (roomId, uid, name, role, joinedAt, leftAt, durationMinutes), `classroomMessages` (chat), `classroomWhiteboard` (stroke documents). Security rules restrict reads/writes to the tutor and enrolled students; rules added to `FIRESTORE_SECURITY_RULES.md`.
2. **Signalling channel**: Supabase Realtime channel per room for SDP offers/answers, ICE candidates, and presence. Whiteboard strokes and chat also broadcast over the same channel, with Firestore persistence so late joiners get the current board and history.
3. **`useWebRTCRoom` hook**: local media capture, peer connections per participant, track publishing, screen-share track swap, mute/camera toggles, cleanup on unmount and on tab close.
4. **Classroom UI** (`src/pages/Classroom.tsx` plus components: `VideoStage`, `ParticipantRail`, `ControlBar`, `Whiteboard`, `ChatPanel`, `RoomSidebar`) styled with existing design tokens to match the mockup's dark-navy shell with orange accents.
5. **Whiteboard**: canvas component, stroke batching, tutor-only tools by default with an "allow students to draw" toggle.
6. **Entry points**: "Join Classroom" buttons alongside existing Zoom buttons in tutor sessions, student sessions, group class sessions, and my-group-classes.
7. **Attendance**: join/leave writes, a duration rollup, and an attendance list on the tutor session view plus admin session monitoring.
8. **Access guard**: route-level check that resolves the room's session and verifies the viewer's enrolment before requesting camera permission.

## Technical notes

- Route: `/classroom/:roomId`, lazy-loaded like other routes, protected for student/tutor/admin roles.
- WebRTC mesh with `RTCPeerConnection`; Google public STUN by default, TURN configurable through a secret when you're ready.
- Realtime signalling via Supabase Realtime broadcast + presence — already part of the stack, no new vendor.
- Zoom code paths are untouched; the classroom is purely additive.
- Screen share uses `getDisplayMedia` and replaces the outgoing video track via `RTCRtpSender.replaceTrack`.
- Mobile: stacked layout, whiteboard read-only on small screens by default.

## Not in this scope

Recording, breakout rooms, virtual backgrounds, and large-lecture (media-server) scaling.
