// Shared Firestore REST helper using a Firebase service account.
// Reads FIREBASE_SERVICE_ACCOUNT_JSON env var.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function pemToBinary(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function loadServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
  const sa = JSON.parse(raw) as ServiceAccount;
  if (!sa.client_email || !sa.private_key || !sa.project_id) {
    throw new Error("Invalid service account JSON");
  }
  return sa;
}

export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

  const sa = loadServiceAccount();
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const keyData = pemToBinary(sa.private_key);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(sig)}`;

  const tokenRes = await fetch(claims.aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  const tokenJson = await tokenRes.json();
  cachedToken = { token: tokenJson.access_token, expiresAt: now + (tokenJson.expires_in ?? 3600) };
  return cachedToken.token;
}

export function projectId(): string {
  return loadServiceAccount().project_id;
}

const FS_BASE = (pid: string) => `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`;

// Convert Firestore REST value → JS
// deno-lint-ignore no-explicit-any
function fromValue(v: any): any {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields ?? {});
  return null;
}
// deno-lint-ignore no-explicit-any
function fromFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromValue(v);
  return out;
}

// deno-lint-ignore no-explicit-any
function toValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFields(v) } };
  return { nullValue: null };
}
// deno-lint-ignore no-explicit-any
function toFields(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = toValue(v);
  return out;
}

export interface FsDoc {
  id: string;
  data: Record<string, any>;
}

export async function listDocs(collection: string): Promise<FsDoc[]> {
  const token = await getAccessToken();
  const pid = projectId();
  const docs: FsDoc[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${FS_BASE(pid)}/${collection}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`listDocs ${collection}: ${res.status} ${await res.text()}`);
    const json = await res.json();
    for (const d of json.documents ?? []) {
      const id = d.name.split("/").pop()!;
      docs.push({ id, data: fromFields(d.fields ?? {}) });
    }
    pageToken = json.nextPageToken;
  } while (pageToken);
  return docs;
}

export async function getDoc(path: string): Promise<FsDoc | null> {
  const token = await getAccessToken();
  const pid = projectId();
  const res = await fetch(`${FS_BASE(pid)}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getDoc ${path}: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return { id: json.name.split("/").pop(), data: fromFields(json.fields ?? {}) };
}

export async function createDoc(collection: string, data: Record<string, any>): Promise<string> {
  const token = await getAccessToken();
  const pid = projectId();
  const res = await fetch(`${FS_BASE(pid)}/${collection}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`createDoc ${collection}: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.name as string).split("/").pop()!;
}

export async function patchDoc(path: string, data: Record<string, any>, updateMask?: string[]): Promise<void> {
  const token = await getAccessToken();
  const pid = projectId();
  const url = new URL(`${FS_BASE(pid)}/${path}`);
  if (updateMask) for (const f of updateMask) url.searchParams.append("updateMask.fieldPaths", f);
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`patchDoc ${path}: ${res.status} ${await res.text()}`);
}

// Structured query with optional where + order
export async function runQuery(
  collection: string,
  // deno-lint-ignore no-explicit-any
  filters: Array<{ field: string; op: string; value: any }> = [],
  limit = 500,
): Promise<FsDoc[]> {
  const token = await getAccessToken();
  const pid = projectId();
  const where = filters.length === 0
    ? undefined
    : filters.length === 1
    ? { fieldFilter: { field: { fieldPath: filters[0].field }, op: filters[0].op, value: toValue(filters[0].value) } }
    : {
        compositeFilter: {
          op: "AND",
          filters: filters.map((f) => ({
            fieldFilter: { field: { fieldPath: f.field }, op: f.op, value: toValue(f.value) },
          })),
        },
      };

  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where,
      limit,
    },
  };
  const res = await fetch(`${FS_BASE(pid)}:runQuery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`runQuery ${collection}: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const docs: FsDoc[] = [];
  for (const row of json) {
    if (!row.document) continue;
    const id = row.document.name.split("/").pop();
    docs.push({ id, data: fromFields(row.document.fields ?? {}) });
  }
  return docs;
}
