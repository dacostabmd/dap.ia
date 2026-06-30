import { describe, it, expect } from "vitest";
import {
  onlyDigits,
  isValidBRPhone,
  normalizeBRPhone,
  formatBRPhone,
  isValidEmail,
  isValidName,
} from "@/lib/validation";

describe("onlyDigits", () => {
  it("remove tudo que não for dígito", () => {
    expect(onlyDigits("(21) 99999-8888")).toBe("21999998888");
    expect(onlyDigits("+55 21 2018-7918")).toBe("552120187918");
    expect(onlyDigits(null)).toBe("");
  });
});

describe("isValidBRPhone", () => {
  it("aceita celular com 11 dígitos (9 na 3ª posição)", () => {
    expect(isValidBRPhone("21999998888")).toBe(true);
    expect(isValidBRPhone("(21) 99999-8888")).toBe(true);
  });

  it("aceita fixo com 10 dígitos", () => {
    expect(isValidBRPhone("2120187918")).toBe(true);
  });

  it("aceita número com DDI 55", () => {
    expect(isValidBRPhone("5521999998888")).toBe(true);
    expect(isValidBRPhone("+55 (21) 99999-8888")).toBe(true);
  });

  it("rejeita celular sem o 9", () => {
    expect(isValidBRPhone("21899998888")).toBe(false); // 11 dígitos, 3º != 9
  });

  it("rejeita DDD começando com 0", () => {
    expect(isValidBRPhone("01999998888")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidBRPhone("123")).toBe(false);
    expect(isValidBRPhone("219999988887777")).toBe(false);
  });

  it("rejeita sequência repetida", () => {
    expect(isValidBRPhone("11111111111")).toBe(false);
  });

  it("rejeita vazio/nulo", () => {
    expect(isValidBRPhone("")).toBe(false);
    expect(isValidBRPhone(undefined)).toBe(false);
  });
});

describe("normalizeBRPhone", () => {
  it("normaliza para E.164", () => {
    expect(normalizeBRPhone("(21) 99999-8888")).toBe("+5521999998888");
    expect(normalizeBRPhone("5521999998888")).toBe("+5521999998888");
    expect(normalizeBRPhone("2120187918")).toBe("+552120187918");
  });
  it("retorna null se inválido", () => {
    expect(normalizeBRPhone("123")).toBeNull();
  });
});

describe("formatBRPhone", () => {
  it("formata celular e fixo", () => {
    expect(formatBRPhone("21999998888")).toBe("(21) 99999-8888");
    expect(formatBRPhone("2120187918")).toBe("(21) 2018-7918");
    expect(formatBRPhone("5521999998888")).toBe("(21) 99999-8888");
  });
});

describe("isValidEmail", () => {
  it("aceita e-mails válidos", () => {
    expect(isValidEmail("joao@dap.com.br")).toBe(true);
    expect(isValidEmail("a.b+c@x.io")).toBe(true);
  });
  it("rejeita inválidos", () => {
    expect(isValidEmail("semarroba.com")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("a@b.c")).toBe(false); // TLD < 2
  });
});

describe("isValidName", () => {
  it("aceita nomes com pelo menos 2 letras", () => {
    expect(isValidName("Ana")).toBe(true);
    expect(isValidName("Jô")).toBe(true);
  });
  it("rejeita curtos ou sem letra", () => {
    expect(isValidName("A")).toBe(false);
    expect(isValidName("12")).toBe(false);
    expect(isValidName("  ")).toBe(false);
  });
});
