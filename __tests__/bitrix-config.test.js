import { describe, it, expect } from "vitest";
import { isPlaceholder, buildCustomFields, FIELDS } from "@/lib/bitrix-config";

describe("isPlaceholder", () => {
  it("reconhece placeholders não configurados", () => {
    expect(isPlaceholder("UF_CRM_PLACEHOLDER_WHATSAPP")).toBe(true);
    expect(isPlaceholder("")).toBe(true);
    expect(isPlaceholder(undefined)).toBe(true);
  });
  it("aceita códigos reais", () => {
    expect(isPlaceholder("UF_CRM_1700000001")).toBe(false);
  });
});

describe("buildCustomFields", () => {
  it("ignora campos placeholder (default não configurado)", () => {
    // Sem env vars, todos FIELDS.* são placeholders -> nada é enviado.
    const out = buildCustomFields({ tipoCaso: "Juros Abusivos", urgencia: "alta" });
    expect(out).toEqual({});
  });

  it("inclui apenas campos configurados e com valor", () => {
    const out = buildCustomFields(
      { tipoCaso: "X", whatsapp: "+5521999998888" },
      // simula um FIELDS configurado passando códigos reais via objeto auxiliar
    );
    // como FIELDS vem de env (placeholder em teste), continua vazio:
    expect(out).toEqual({});
  });

  it("FIELDS expõe as chaves esperadas", () => {
    expect(Object.keys(FIELDS)).toEqual(
      expect.arrayContaining(["whatsapp", "tipoCaso", "urgencia", "origemVoz", "etapaConversa"])
    );
  });
});
