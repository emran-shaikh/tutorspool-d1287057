// Deletes a Firebase Authentication account (admin-only).
// Firestore documents are removed by the client; this removes the login itself
// so the same email can register again.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri: string;
}

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
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function loadServiceAccount(): ServiceAccount {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
  const sa = JSON.parse(raw) as ServiceAccount;
  if (!sa.client_email || !sa.private_key || !sa.project_id) throw new Error("Invalid service account JSON");
  return sa;
}

async function getAccessToken(): Promise<{ token: string; projectId: string }> {
  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const aud = sa.token_uri || "https://oauth2.googleapis.com/token";
  const claims = {
    iss: sa.client_email,
    scope: [
      "https://www.googleapis.com/auth/datastore",
      "https://www.googleapis.com/auth/firebase",
      "https://www.googleapis.com/auth/identitytoolkit",
    ].join(" "),
    aud,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBinary(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(sig)}`;
  const res = await fetch(aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  const json = await res.json();
  return { token: json.access_token, projectId: sa.project_id };
}

async function lookupAccount(token: string, projectId: string, body: Record<string, unknown>) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`Lookup failed: ${await res.text()}`);
  const json = await res.json();
  return json.users?.[0] ?? null;
}

async function isAdmin(token: string, projectId: string, uid: string): Promise<boolean> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return false;
  const doc = await res.json();
  return doc?.fields?.role?.stringValue === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idToken, uid, email } = await req.json();
    if (!idToken) {
      return new Response(JSON.stringify({ error: "Missing idToken" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token, projectId } = await getAccessToken();

    // Verify the caller is a signed-in admin
    const caller = await lookupAccount(token, projectId, { idToken });
    if (!caller?.localId || !(await isAdmin(token, projectId, caller.localId))) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the target account
    let targetUid = uid as string | undefined;
    if (!targetUid && email) {
      const found = await lookupAccount(token, projectId, { email: [email] });
      targetUid = found?.localId;
    }
    if (!targetUid) {
      return new Response(JSON.stringify({ deleted: false, reason: "account_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const delRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ localId: targetUid }),
      },
    );
    if (!delRes.ok) {
      const text = await delRes.text();
      if (text.includes("USER_NOT_FOUND")) {
        return new Response(JSON.stringify({ deleted: false, reason: "account_not_found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Delete failed: ${text}`);
    }

    return new Response(JSON.stringify({ deleted: true, uid: targetUid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-auth-user error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
