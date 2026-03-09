

# Plan: Add ElevenLabs Conversational AI Voice Agent

## Overview

Add a voice agent button to the site that lets users have a real-time voice conversation with an AI tutor assistant, powered by ElevenLabs Conversational AI.

## Prerequisites

1. **ElevenLabs Connection** — Connect your ElevenLabs account via the connector so the API key is available as a secret.
2. **ElevenLabs Agent** — You need to create a Conversational AI Agent in the [ElevenLabs dashboard](https://elevenlabs.io/app/conversational-ai). This gives you an Agent ID that we configure server-side.

## Implementation Steps

### 1. Connect ElevenLabs
Use the ElevenLabs connector to link your API key to this project.

### 2. Create Edge Function: `elevenlabs-conversation-token`
A backend function that generates a single-use WebRTC conversation token. It takes the Agent ID (stored as a secret) and calls the ElevenLabs token endpoint. This keeps the API key secure server-side.

### 3. Install `@elevenlabs/react` SDK
Provides the `useConversation` hook for managing WebSocket/WebRTC connections and audio.

### 4. Create `VoiceAgent` Component
A floating voice agent button (similar to the existing chatbot button placement but on the opposite side). When clicked:
- Requests microphone permission
- Fetches a conversation token from the edge function
- Starts a WebRTC voice session with the ElevenLabs agent
- Shows connection status, speaking/listening state, and a stop button
- Animated visual indicator when the agent is speaking

### 5. Integrate into App
Add the `VoiceAgent` component alongside the existing `ChatBot` in the app layout.

### 6. Update `supabase/config.toml`
Register the new edge function with `verify_jwt = false`.

## Technical Details

- **Transport**: WebRTC (recommended for lowest latency)
- **Component location**: `src/components/VoiceAgent.tsx`
- **Edge function**: `supabase/functions/elevenlabs-conversation-token/index.ts`
- **Agent ID**: Stored as a secret (`ELEVENLABS_AGENT_ID`) to keep it configurable
- **Positioning**: Floating button on the bottom-left to avoid conflicting with the chatbot on the bottom-right

