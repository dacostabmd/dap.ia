// Funções puras de validação e normalização.
// Sem dependências externas — testáveis isoladamente (Vitest).

/**
 * Remove tudo que não for dígito.
 * @param {string} value
 * @returns {string}
 */
export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Valida um número de telefone/celular brasileiro.
 * Aceita com ou sem DDI 55, com ou sem máscara.
 * Regras:
 *  - Celular: 11 dígitos (DDD + 9 + 8 dígitos), o 3º dígito deve ser 9.
 *  - Fixo: 10 dígitos (DDD + 8 dígitos).
 *  - DDD válido: 11 a 99 (primeiro dígito 1-9, não 0).
 * @param {string} value
 * @returns {boolean}
 */
export function isValidBRPhone(value) {
  let d = onlyDigits(value);
  // remove DDI 55 quando o restante tiver tamanho de número nacional
  if (d.length === 13 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 12 && d.startsWith("55")) d = d.slice(2);

  if (d.length !== 10 && d.length !== 11) return false;

  const ddd = d.slice(0, 2);
  if (ddd[0] === "0") return false; // DDD não começa com 0

  // celular (11 dígitos) precisa do 9 na terceira posição
  if (d.length === 11 && d[2] !== "9") return false;

  // rejeita sequências obviamente inválidas (todos iguais)
  if (/^(\d)\1+$/.test(d)) return false;

  return true;
}

/**
 * Normaliza para o formato E.164 brasileiro: +55DDDNUMERO.
 * Retorna null se inválido.
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeBRPhone(value) {
  if (!isValidBRPhone(value)) return null;
  let d = onlyDigits(value);
  if ((d.length === 13 || d.length === 12) && d.startsWith("55")) d = d.slice(2);
  return `+55${d}`;
}

/**
 * Formata para exibição amigável: (21) 99999-9999 ou (21) 2018-7918.
 * Retorna a entrada original (apenas dígitos) se não der para formatar.
 * @param {string} value
 * @returns {string}
 */
export function formatBRPhone(value) {
  let d = onlyDigits(value);
  if ((d.length === 13 || d.length === 12) && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

// Regex de e-mail pragmática (não a RFC completa, mas cobre os casos reais).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida formato de e-mail.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  const v = String(value ?? "").trim();
  if (v.length > 254) return false;
  return EMAIL_RE.test(v);
}

/**
 * Valida nome (mínimo 2 caracteres, ao menos uma letra).
 * @param {string} value
 * @returns {boolean}
 */
export function isValidName(value) {
  const v = String(value ?? "").trim();
  return v.length >= 2 && /\p{L}/u.test(v);
}
