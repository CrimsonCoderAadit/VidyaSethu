/**
 * Inbound WhatsApp / SMS webhook.
 *
 * Accepts three payload shapes so any gateway can be plugged in:
 *  - Meta WhatsApp Cloud API: JSON { entry[].changes[].value.messages[] { from, text.body } }
 *    Verified with X-Hub-Signature-256 (HMAC-SHA256 of the raw body with WHATSAPP_APP_SECRET).
 *    Reply is sent via Graph API when WHATSAPP_TOKEN + WHATSAPP_PHONE_ID are set.
 *  - Twilio (WhatsApp or SMS): form-encoded From / Body → TwiML reply in the response.
 *  - Generic SMS gateway / demo: JSON { from, text, channel? } → JSON { reply }.
 * GET handles Meta's subscription handshake (hub.verify_token / hub.challenge).
 * Non-Meta gateways must send X-Gateway-Key = SMS_GATEWAY_KEY when that is configured, so
 * nobody can spoof a `from` number to read someone's status.
 */
import { handleInbound } from "@/lib/bot";
import { mutateDb } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === token) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validMetaSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // demo mode: no secret configured
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(raw).digest("hex"));
  const got = Buffer.from(header.slice(7));
  return expected.length === got.length && timingSafeEqual(expected, got);
}

async function sendViaGraph(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  }).catch(() => {});
}

const xml = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

function gatewayAllowed(req: Request): boolean {
  const key = process.env.SMS_GATEWAY_KEY;
  return !key || req.headers.get("x-gateway-key") === key;
}

export async function POST(req: Request) {
  const type = req.headers.get("content-type") ?? "";

  if (type.includes("application/x-www-form-urlencoded")) {
    if (!gatewayAllowed(req)) return new Response("Forbidden", { status: 403 });
    const form = new URLSearchParams(await req.text());
    const from = form.get("From") ?? "";
    const channel = from.startsWith("whatsapp:") ? "WHATSAPP" : "SMS";
    const reply = mutateDb((db) => handleInbound(db, from, form.get("Body") ?? "", channel));
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xml(reply)}</Message></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const raw = await req.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (json.object === "whatsapp_business_account") {
    if (!validMetaSignature(raw, req.headers.get("x-hub-signature-256"))) return new Response("Bad signature", { status: 401 });
    type MetaMsg = { from: string; type: string; text?: { body: string } };
    const entries = (json.entry as { changes: { value: { messages?: MetaMsg[] } }[] }[]) ?? [];
    for (const m of entries.flatMap((e) => e.changes.flatMap((c) => c.value.messages ?? []))) {
      if (m.type !== "text" || !m.text) continue;
      const reply = mutateDb((db) => handleInbound(db, m.from, m.text!.body, "WHATSAPP"));
      await sendViaGraph(m.from, reply);
    }
    return Response.json({ ok: true });
  }

  if (!gatewayAllowed(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  const from = String(json.from ?? "");
  const text = String(json.text ?? "");
  if (!from || !text) return Response.json({ error: "from and text are required" }, { status: 400 });
  const channel = json.channel === "SMS" ? "SMS" : "WHATSAPP";
  const reply = mutateDb((db) => handleInbound(db, from, text, channel));
  return Response.json({ reply });
}
