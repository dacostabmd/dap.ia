import { describe, it, expect } from "vitest";
import {
  detectTipoCaso,
  detectUrgencia,
  deriveStage,
  shouldOfferForm,
  buildFallbackMeta,
} from "@/lib/lead-heuristics";

describe("detectTipoCaso", () => {
  it("detecta busca e apreensão", () => {
    expect(detectTipoCaso("meu carro foi apreendido")).toBe("Busca e Apreensão");
  });
  it("detecta juros abusivos", () => {
    expect(detectTipoCaso("acho que meus juros estão abusivos")).toBe("Juros Abusivos");
  });
  it("detecta trabalhista", () => {
    expect(detectTipoCaso("fui demitido sem justa causa")).toBe("Trabalhista");
  });
  it("retorna vazio quando nada casa", () => {
    expect(detectTipoCaso("olá, bom dia")).toBe("");
  });
});

describe("detectUrgencia", () => {
  it("alta com prazo/hoje/apreendido", () => {
    expect(detectUrgencia("é urgente, tem audiência amanhã")).toBe("alta");
    expect(detectUrgencia("vão leiloar meu carro")).toBe("alta");
  });
  it("media", () => {
    expect(detectUrgencia("preciso resolver essa semana")).toBe("media");
  });
  it("baixa por padrão", () => {
    expect(detectUrgencia("queria entender meus direitos")).toBe("baixa");
  });
});

describe("deriveStage", () => {
  it("entendendo no início", () => {
    expect(deriveStage({ userTurns: 1, hasContact: false })).toBe("entendendo");
  });
  it("diagnostico após 2 trocas", () => {
    expect(deriveStage({ userTurns: 2, hasContact: false })).toBe("diagnostico");
  });
  it("advogado quando há contato", () => {
    expect(deriveStage({ userTurns: 5, hasContact: true })).toBe("advogado");
  });
});

describe("shouldOfferForm", () => {
  it("não oferece antes de 2 trocas", () => {
    expect(shouldOfferForm({ userTurns: 1, hasContact: false })).toBe(false);
  });
  it("oferece a partir de 2 trocas", () => {
    expect(shouldOfferForm({ userTurns: 2, hasContact: false })).toBe(true);
  });
  it("não oferece se já tem contato", () => {
    expect(shouldOfferForm({ userTurns: 4, hasContact: true })).toBe(false);
  });
});

describe("buildFallbackMeta", () => {
  const hist = [
    { role: "user", content: "meu carro foi apreendido, é urgente" },
    { role: "bot", content: "entendi" },
    { role: "user", content: "tem prazo pra resolver?" },
  ];

  it("usa heurística quando serverMeta vazio", () => {
    const meta = buildFallbackMeta(hist, {}, { hasContact: false });
    expect(meta.tipoCaso).toBe("Busca e Apreensão");
    expect(meta.urgencia).toBe("alta");
    expect(meta.stage).toBe("diagnostico");
    expect(meta.readyForForm).toBe(true);
  });

  it("serverMeta tem prioridade campo a campo", () => {
    const meta = buildFallbackMeta(hist, { tipoCaso: "Outro", stage: "advogado" }, { hasContact: false });
    expect(meta.tipoCaso).toBe("Outro");
    expect(meta.stage).toBe("advogado");
    // urgencia não veio do server -> heurística
    expect(meta.urgencia).toBe("alta");
  });

  it("respeita readyForForm explícito do servidor", () => {
    const meta = buildFallbackMeta(hist, { readyForForm: false }, { hasContact: false });
    expect(meta.readyForForm).toBe(false);
  });
});
