// Rate-limit por IP usando um cookie ASSINADO (HMAC) — sem infra externa.
//
// O cookie guarda { count, windowStart } e uma assinatura HMAC-SHA256 sobre
// esses dados + o IP do cliente. A assinatura impede que o usuário FORJE a
// contagem (ex.: editar o cookie para count=0). Atrelar ao IP evita que o
// cookie seja transferido de uma máquina para outra.
//
// Limitação conhecida: o usuário ainda pode LIMPAR os cookies / usar aba
// anônima para reiniciar a janela. Sem um store server-side (Redis/DB) por IP
// não há como impedir isso — é o teto do que um cookie oferece.
//
// Config: RATE_LIMIT_SECRET (obrigatória em produção p/ a assinatura valer).

import crypto from "crypto";

export const RATE_LIMIT_COOKIE = "dapia_rl";
export const MAX_QUESTIONS = 4;
export const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

// Em dev, sem segredo definido, cai num valor fixo (a proteção é fraca, mas
// não quebra o fluxo local). Em produção, DEFINA RATE_LIMIT_SECRET.
const SECRET = process.env.RATE_LIMIT_SECRET || "dev-insecure-rate-limit-secret";

/** Extrai o IP do cliente dos headers de proxy (Vercel/Nginx) com fallback. */
export function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function sign(payload, ip) {
  return crypto.createHmac("sha256", SECRET).update(`${payload}.${ip}`).digest("base64url");
}

/**
 * Lê e valida o cookie de rate-limit para este IP.
 * @param {string|undefined} cookieValue  valor cru do cookie
 * @param {string} ip
 * @param {number} now  Date.now()
 * @returns {{count:number, windowStart:number}} estado atual (zerado se inválido/expirado)
 */
export function readState(cookieValue, ip, now) {
  const fresh = { count: 0, windowStart: now };
  if (!cookieValue) return fresh;

  const dot = cookieValue.lastIndexOf(".");
  if (dot < 0) return fresh;

  const payload = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);

  // assinatura precisa bater com este IP — senão trata como cookie novo
  const expected = sign(payload, ip);
  if (!timingSafeEqual(sig, expected)) return fresh;

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return fresh;
  }

  const count = Number.isInteger(parsed.c) ? parsed.c : 0;
  const windowStart = Number.isInteger(parsed.w) ? parsed.w : now;

  // janela expirou -> reinicia
  if (now - windowStart >= WINDOW_MS) return fresh;

  return { count, windowStart };
}

/** Serializa o estado num valor de cookie assinado para este IP. */
export function serializeState(state, ip) {
  const payload = Buffer.from(JSON.stringify({ c: state.count, w: state.windowStart }), "utf8").toString("base64url");
  return `${payload}.${sign(payload, ip)}`;
}

/** Compara duas strings em tempo constante (evita timing attacks na assinatura). */
function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Monta o header Set-Cookie para o estado (HttpOnly, expira no fim da janela). */
export function buildSetCookie(state, ip) {
  const value = serializeState(state, ip);
  const maxAgeSec = Math.max(0, Math.ceil((state.windowStart + WINDOW_MS - Date.now()) / 1000));
  const parts = [
    `${RATE_LIMIT_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
