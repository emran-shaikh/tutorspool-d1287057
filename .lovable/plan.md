

## Plan: Add Client Tools to Voice Agent for Actionable Decisions

The voice agent currently only answers questions. This plan adds **client tools** so the agent can take actions on behalf of the user — like navigating to pages, opening WhatsApp support, and showing toast notifications.

**Important prerequisite:** Each client tool listed below must also be registered in the ElevenLabs dashboard for the agent. Without that, the agent won't call them.

### Changes

**1. Update `src/components/VoiceAgent.tsx`**

- Wrap the component to use `react-router-dom`'s `useNavigate` hook
- Add `clientTools` to the `useConversation` hook with the following tools:

| Tool Name | What It Does | Parameters |
|-----------|-------------|------------|
| `navigateTo` | Navigates user to any platform page | `{ page: string }` (e.g. `/find-tutors`, `/register`, `/login`, `/subjects`, `/contact`, `/help-center`, `/faq`, `/about`, `/reviews`) |
| `openWhatsApp` | Opens WhatsApp support chat | none |
| `showNotification` | Shows a toast message to the user | `{ title: string, message: string }` |

- Update the system prompt to inform the agent about these tools and when to use them (e.g. "If the user wants to find tutors, use the navigateTo tool with page '/find-tutors'")
- Add route mapping instructions in the prompt so the agent knows which pages exist

**2. Register Client Tools in ElevenLabs Dashboard (manual step)**

You will need to add these three tools in your ElevenLabs agent settings with matching names and parameter schemas.

### Technical Details

The `clientTools` object is passed to `useConversation`. Each function receives parameters from the agent and returns a string confirmation. The `navigateTo` tool uses `window.location.href` for navigation (simpler than requiring the component to be inside Router context, since it's rendered at app root level).

