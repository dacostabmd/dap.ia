// Heurística LEVE de fallback para enquanto a API RAG ainda não devolve `meta`.
// Quando o backend passar a enviar meta (ver docs/backend-rag-prompt.md), esses
// valores são substituídos pelos do servidor. Funções puras — testáveis e
// reutilizáveis no client (Chat.jsx). Sem dependências.

// Mapeia matchers -> tipo de caso (alinhado com lib/data.js).
// Cada item pode ter `kw` (substrings simples) e/ou `all` (conjuntos de termos
// que precisam coexistir na frase, ex.: "juros" + "abusiv"). A ordem importa:
// o primeiro que casar vence.
const TIPO_KEYWORDS = [
  { tipo: "Busca e Apreensão", kw: ["apreendido", "apreensão", "apreensao", "tomaram meu carro", "tomaram minha moto", "retomada", "leiloar"] },
  { tipo: "Juros Abusivos", kw: ["juros abusivos", "anatocismo", "taxa abusiva"], all: [["juros", "abusiv"], ["juros", "alto"], ["parcela", "alta"]] },
  { tipo: "Revisão de Financiamento", kw: ["revisar financiamento", "revisar contrato", "revisão de financiamento", "tarifa", " tac ", "seguro embutido"] },
  { tipo: "Negativação Indevida", kw: ["negativado", "negativação", "negativacao", "spc", "serasa", "nome sujo"] },
  { tipo: "Fraudes Bancárias", kw: ["golpe", "fraude", "pix", "clonagem", "clonaram", "estelionato", "falso boleto"] },
  { tipo: "Trabalhista", kw: ["demitido", "demissão", "demissao", "rescisão", "rescisao", "verbas", "hora extra", "horas extras", "trabalhista", "mandado embora"] },
  { tipo: "Família e Sucessões", kw: ["divórcio", "divorcio", "pensão", "pensao", "guarda", "inventário", "inventario", "partilha", "herança", "heranca"] },
  { tipo: "Previdenciário", kw: ["aposentadoria", "inss", "auxílio", "auxilio", "bpc", "benefício", "beneficio", "previdenciário", "previdenciario"] },
];

// Sinais de urgência alta.
const URGENCIA_ALTA = ["hoje", "agora", "urgente", "prazo", "amanhã", "leilão", "leiloar", "vão vender", "audiência", "intimação", "penhora", "bloqueio", "apreendido"];
const URGENCIA_MEDIA = ["essa semana", "logo", "rápido", "dias"];

function norm(s) {
  return String(s ?? "").toLowerCase();
}

/**
 * Detecta o tipo de caso a partir do texto livre (todas as mensagens do usuário).
 * @param {string} text
 * @returns {string} tipo ou "" se nada casar
 */
export function detectTipoCaso(text) {
  const t = norm(text);
  for (const { tipo, kw = [], all = [] } of TIPO_KEYWORDS) {
    if (kw.some((k) => t.includes(k))) return tipo;
    if (all.some((set) => set.every((term) => t.includes(term)))) return tipo;
  }
  return "";
}

/**
 * Classifica urgência: alta | media | baixa.
 * @param {string} text
 * @returns {"alta"|"media"|"baixa"}
 */
export function detectUrgencia(text) {
  const t = norm(text);
  if (URGENCIA_ALTA.some((k) => t.includes(k))) return "alta";
  if (URGENCIA_MEDIA.some((k) => t.includes(k))) return "media";
  return "baixa";
}

/**
 * Decide o estágio da conversa para o stepper, dado o nº de trocas do usuário
 * e se o contato já foi capturado.
 * @param {{userTurns:number, hasContact:boolean}} s
 * @returns {"entendendo"|"diagnostico"|"advogado"}
 */
export function deriveStage({ userTurns, hasContact }) {
  if (hasContact) return "advogado";
  if (userTurns >= 2) return "diagnostico";
  return "entendendo";
}

/**
 * Deve oferecer o formulário de captura agora? (fallback local)
 * Após a 2ª–3ª troca do usuário e antes de já ter contato.
 * @param {{userTurns:number, hasContact:boolean}} s
 */
export function shouldOfferForm({ userTurns, hasContact }) {
  return !hasContact && userTurns >= 2;
}

/**
 * Constrói um meta de fallback a partir do histórico, mesclando o que o
 * servidor mandou (serverMeta tem prioridade campo a campo).
 * @param {Array<{role:string, content:string}>} historico
 * @param {object} serverMeta
 * @param {{hasContact:boolean}} ctx
 */
export function buildFallbackMeta(historico, serverMeta = {}, ctx = {}) {
  const userMsgs = (historico || []).filter((m) => m.role === "user");
  const allUserText = userMsgs.map((m) => m.content).join(" ");
  const userTurns = userMsgs.length;
  const hasContact = Boolean(ctx.hasContact);

  const tipoCaso = serverMeta.tipoCaso || detectTipoCaso(allUserText);
  const urgencia = serverMeta.urgencia || detectUrgencia(allUserText);
  const stage = serverMeta.stage || deriveStage({ userTurns, hasContact });
  const readyForForm =
    serverMeta.readyForForm !== undefined
      ? Boolean(serverMeta.readyForForm)
      : shouldOfferForm({ userTurns, hasContact });

  return {
    stage,
    tipoCaso,
    urgencia,
    readyForForm,
    diagnosticoParcial: serverMeta.diagnosticoParcial || "",
    extracted: serverMeta.extracted || {},
  };
}
