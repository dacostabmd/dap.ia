import { describe, it, expect } from "vitest";
import {
  readState,
  serializeState,
  buildSetCookie,
  getClientIp,
  MAX_QUESTIONS,
  WINDOW_MS,
  RATE_LIMIT_COOKIE,
} from "@/lib/rate-limit";

const IP = "203.0.113.9";
const NOW = 1_700_000_000_000;

describe("rate-limit: round-trip do cookie assinado", () => {
  it("um estado serializado é lido de volta idêntico (mesmo IP)", () => {
    const state = { count: 3, windowStart: NOW };
    const cookie = serializeState(state, IP);
    expect(readState(cookie, IP, NOW + 1000)).toEqual(state);
  });

  it("cookie ausente => estado zerado começando agora", () => {
    expect(readState(undefined, IP, NOW)).toEqual({ count: 0, windowStart: NOW });
  });
});

describe("rate-limit: proteção contra adulteração", () => {
  it("payload adulterado (assinatura não bate) => zera", () => {
    const cookie = serializeState({ count: 4, windowStart: NOW }, IP);
    // troca o payload mantendo a assinatura antiga
    const tampered = cookie.replace(/^[^.]+/, "eyJjIjowLCJ3IjoxfQ");
    expect(readState(tampered, IP, NOW + 1000)).toEqual({ count: 0, windowStart: NOW + 1000 });
  });

  it("cookie de OUTRO ip não é aceito (assinatura atrelada ao IP)", () => {
    const cookie = serializeState({ count: 4, windowStart: NOW }, IP);
    const other = readState(cookie, "198.51.100.7", NOW + 1000);
    expect(other.count).toBe(0);
  });

  it("lixo sem ponto => zera", () => {
    expect(readState("abcdef", IP, NOW).count).toBe(0);
  });
});

describe("rate-limit: janela de 24h", () => {
  it("dentro da janela mantém a contagem", () => {
    const cookie = serializeState({ count: 2, windowStart: NOW }, IP);
    expect(readState(cookie, IP, NOW + WINDOW_MS - 1).count).toBe(2);
  });

  it("após 24h reinicia (nova janela)", () => {
    const cookie = serializeState({ count: MAX_QUESTIONS, windowStart: NOW }, IP);
    const after = readState(cookie, IP, NOW + WINDOW_MS + 1);
    expect(after.count).toBe(0);
    expect(after.windowStart).toBe(NOW + WINDOW_MS + 1);
  });
});

describe("buildSetCookie", () => {
  it("emite o cookie com flags de segurança e Max-Age > 0 dentro da janela", () => {
    const header = buildSetCookie({ count: 1, windowStart: Date.now() }, IP);
    expect(header).toContain(`${RATE_LIMIT_COOKIE}=`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toMatch(/Max-Age=\d+/);
  });
});

describe("getClientIp", () => {
  const mk = (headers) => ({ headers: { get: (k) => headers[k.toLowerCase()] ?? null } });
  it("usa o primeiro IP de x-forwarded-for", () => {
    expect(getClientIp(mk({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("cai para x-real-ip quando não há xff", () => {
    expect(getClientIp(mk({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });
  it("retorna 'unknown' sem headers", () => {
    expect(getClientIp(mk({}))).toBe("unknown");
  });
});
