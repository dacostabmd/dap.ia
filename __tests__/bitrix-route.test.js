import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do cliente Bitrix — nenhuma requisição real é feita.
vi.mock("@/lib/bitrix", () => ({
  createDeal: vi.fn(async () => "deal-42"),
  updateDeal: vi.fn(async () => ({ result: true })),
  addTimelineComment: vi.fn(async () => ({ result: "cmt-1" })),
  addActivity: vi.fn(async () => ({ result: "act-1" })),
  postLeadToFeed: vi.fn(async () => ({ result: "post-1" })),
}));

// Mantém o flag de "configurado" estável nos testes.
vi.mock("@/lib/bitrix-config", () => ({ isBitrixConfigured: false }));

import { POST } from "@/app/api/bitrix/route";
import * as bitrix from "@/lib/bitrix";

function makeReq(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/bitrix — create", () => {
  it("cria deal com dados válidos e grava histórico", async () => {
    const res = await POST(
      makeReq({
        action: "create",
        nome: "João Silva",
        telefone: "(21) 99999-8888",
        email: "joao@dap.com.br",
        tipoCaso: "Busca e Apreensão",
        urgencia: "alta",
        origemVoz: true,
        historico: [
          { role: "user", content: "Meu carro foi apreendido", voice: true },
          { role: "bot", content: "Entendi, vamos ver as opções" },
        ],
      })
    );
    const json = await res.json();
    expect(res.status ?? 200).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.dealId).toBe("deal-42");

    // telefone deve chegar normalizado ao cliente
    expect(bitrix.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({ telefone: "+5521999998888", origemVoz: true })
    );
    // comentário com transcrição de voz
    expect(bitrix.addTimelineComment).toHaveBeenCalledWith(
      "deal-42",
      expect.stringContaining("VOZ")
    );
  });

  it("rejeita telefone inválido", async () => {
    const res = await POST(
      makeReq({ action: "create", nome: "Ana", telefone: "123" })
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(bitrix.createDeal).not.toHaveBeenCalled();
  });

  it("rejeita nome inválido", async () => {
    const res = await POST(
      makeReq({ action: "create", nome: "A", telefone: "21999998888" })
    );
    expect(res.status).toBe(400);
    expect(bitrix.createDeal).not.toHaveBeenCalled();
  });

  it("rejeita e-mail inválido quando informado", async () => {
    const res = await POST(
      makeReq({ action: "create", nome: "Ana Paula", telefone: "21999998888", email: "x@y" })
    );
    expect(res.status).toBe(400);
    expect(bitrix.createDeal).not.toHaveBeenCalled();
  });
});

describe("POST /api/bitrix — update", () => {
  it("exige dealId", async () => {
    const res = await POST(makeReq({ action: "update", tipoCaso: "X" }));
    expect(res.status).toBe(400);
    expect(bitrix.updateDeal).not.toHaveBeenCalled();
  });

  it("atualiza deal existente sem criar novo", async () => {
    const res = await POST(
      makeReq({ action: "update", dealId: "deal-42", tipoCaso: "Juros Abusivos", urgencia: "media" })
    );
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(bitrix.updateDeal).toHaveBeenCalledWith(
      "deal-42",
      expect.objectContaining({ tipoCaso: "Juros Abusivos" })
    );
    expect(bitrix.createDeal).not.toHaveBeenCalled();
  });
});

describe("POST /api/bitrix — schedule", () => {
  it("cria atividade e publica no feed", async () => {
    const res = await POST(
      makeReq({
        action: "schedule",
        dealId: "deal-42",
        nome: "João Silva",
        tipoCaso: "Busca e Apreensão",
        urgencia: "alta",
        startIso: "2026-07-01T14:00:00-03:00",
        endIso: "2026-07-01T14:30:00-03:00",
        label: "amanhã 14h",
      })
    );
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.scheduled).toBe(true);
    expect(bitrix.addActivity).toHaveBeenCalledWith(
      expect.objectContaining({ dealId: "deal-42", startIso: expect.any(String) })
    );
    expect(bitrix.postLeadToFeed).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "João Silva", urgencia: "alta", dealId: "deal-42" })
    );
  });

  it("exige startIso/endIso", async () => {
    const res = await POST(makeReq({ action: "schedule", dealId: "deal-42" }));
    expect(res.status).toBe(400);
    expect(bitrix.addActivity).not.toHaveBeenCalled();
  });
});

describe("POST /api/bitrix — erros", () => {
  it("rejeita ação desconhecida", async () => {
    const res = await POST(makeReq({ action: "explode" }));
    expect(res.status).toBe(400);
  });

  it("trata corpo inválido", async () => {
    const badReq = { json: async () => { throw new Error("bad json"); } };
    const res = await POST(badReq);
    expect(res.status).toBe(400);
  });
});
