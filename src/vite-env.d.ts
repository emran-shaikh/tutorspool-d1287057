/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional TURN relay URL(s) for WebRTC classrooms; comma-separated for multiple. */
  readonly VITE_TURN_URL?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
