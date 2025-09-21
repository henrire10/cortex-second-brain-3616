
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Firebase service account credentials
const SERVICE_ACCOUNT_JSON = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");

// Cached OAuth token
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function base64UrlEncode(input: Uint8Array) {
  let str = "";
  for (let i = 0; i < input.length; i++) str += String.fromCharCode(input[i]);
  const b64 = btoa(str);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeString(input: string) {
  const enc = new TextEncoder().encode(input);
  return base64UrlEncode(enc);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(): Promise<string> {
  if (!SERVICE_ACCOUNT_JSON || !FIREBASE_PROJECT_ID) {
    throw new Error("Firebase service account not configured: set FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID");
  }

  // Return cached token if valid for > 60s
  if (cachedAccessToken && cachedAccessToken.expiresAt - 60 > Math.floor(Date.now() / 1000)) {
    return cachedAccessToken.token;
  }

  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64UrlEncodeString(JSON.stringify(header));
  const claimsB64 = base64UrlEncodeString(JSON.stringify(claims));
  const signingInput = `${headerB64}.${claimsB64}`;

  // Import private key and sign
  const keyData = pemToArrayBuffer(sa.private_key as string);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  ));
  const jwt = `${signingInput}.${base64UrlEncode(signature)}`;

  // Exchange JWT for access token
  const tokenRes = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => "");
    throw new Error(`OAuth token error ${tokenRes.status}: ${txt}`);
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token as string;
  const expiresIn = Number(tokenJson.expires_in ?? 3600);
  cachedAccessToken = { token: accessToken, expiresAt: now + expiresIn };

  return accessToken;
}

async function isAdmin(authHeader: string | null) {
  try {
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });
    const { data, error } = await authClient.rpc("is_admin_user");
    if (error) {
      console.error("is_admin_user RPC error:", error);
      return false;
    }
    return Boolean(data);
  } catch (e) {
    console.error("isAdmin exception:", e);
    return false;
  }
}

async function sendFcmV1Message(token: string, title: string, body: string) {
  const accessToken = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
  const payload = {
    message: {
      token,
      notification: { title, body },
      data: { type: "broadcast" },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`FCM v1 error ${res.status}: ${txt}`);
  }
  return await res.json().catch(() => ({}));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    const adminOk = await isAdmin(authHeader);
    if (!adminOk) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, title } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'message'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SERVICE_ACCOUNT_JSON || !FIREBASE_PROJECT_ID) {
      return new Response(
        JSON.stringify({ error: "Firebase service account not configured (FIREBASE_SERVICE_ACCOUNT_KEY, FIREBASE_PROJECT_ID)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Supabase client with service role for DB access
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch push subscriptions – prefer fcm_token
    const { data: subs, error } = await serviceClient
      .from("push_subscriptions")
      .select("fcm_token, endpoint, is_active")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return new Response(JSON.stringify({ error: "Failed to load subscriptions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build unique token list
    const tokenSet = new Set<string>();

    (subs ?? []).forEach((s: any) => {
      if (s?.fcm_token && typeof s.fcm_token === "string") {
        tokenSet.add(s.fcm_token);
      } else if (typeof s?.endpoint === "string" && !s.endpoint.startsWith("http")) {
        // Fallback for legacy stored tokens
        tokenSet.add(s.endpoint);
      }
    });

    const tokens = Array.from(tokenSet);
    const skipped = (subs?.length ?? 0) - tokens.length;

    const batchSize = 100;
    let success = 0;
    let fail = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((t) => sendFcmV1Message(t, title ?? "Comunicado", message))
      );
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          success++;
        } else {
          fail++;
          console.error("FCM v1 send error token:", batch[idx], "reason:", r.reason);
        }
      });
    }

    // Log summary
    await serviceClient.from("system_logs").insert({
      log_level: "INFO",
      message: `Broadcast push (v1): total=${subs?.length ?? 0}, tokens=${tokens.length}, skipped=${skipped}, success=${success}, fail=${fail}`,
    });

    return new Response(
      JSON.stringify({
        total: subs?.length ?? 0,
        fcm_tokens: tokens.length,
        skipped,
        success,
        fail,
        api: "fcm_http_v1",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-broadcast-notification (v1) error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
