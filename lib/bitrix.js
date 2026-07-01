// Cliente fino para o webhook REST do Bitrix24.
//
// Em MODO MOCK (sem BITRIX_WEBHOOK_URL) nenhuma requisição de rede é feita:
// as funções retornam respostas simuladas e logam o payload — permite rodar e
// testar tudo localmente sem credenciais. Com a URL configurada, chama de verdade.
//
// Toda chamada tem timeout (resiliência, conforme CLAUDE.md). Erros são logados
// e propagados para a rota tratar com fallback amigável.

import {
  BITRIX_WEBHOOK_URL,
  isBitrixConfigured,
  buildCustomFields,
  CATEGORY_ID,
  STAGE_ID,
  SOURCE_ID,
  ASSIGNED_BY_ID,
} from "./bitrix-config";

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Chama um método REST do Bitrix (ex.: "crm.deal.add").
 * Em modo mock, devolve { mock:true, result, _method, _params }.
 * @param {string} method
 * @param {Record<string, unknown>} params
 * @param {{ mockResult?: unknown, timeoutMs?: number }} [opts]
 */
export async function callBitrix(method, params = {}, opts = {}) {
  const { mockResult, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  if (!isBitrixConfigured) {
    console.info(`[bitrix:mock] ${method}`, JSON.stringify(params));
    return { mock: true, result: mockResult ?? true, _method: method, _params: params };
  }

  const base = BITRIX_WEBHOOK_URL.endsWith("/") ? BITRIX_WEBHOOK_URL : `${BITRIX_WEBHOOK_URL}/`;
  const url = `${base}${method}.json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      const msg = data.error_description || data.error || `HTTP ${res.status}`;
      console.error(`[bitrix] ${method} falhou:`, msg);
      throw new Error(`Bitrix ${method}: ${msg}`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error(`[bitrix] ${method} timeout após ${timeoutMs}ms`);
      throw new Error(`Bitrix ${method}: timeout`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Extrai o ID retornado por add/update (Bitrix devolve em data.result). */
export function extractId(response) {
  if (!response) return null;
  // mock: result pode já ser o id
  const r = response.result;
  if (typeof r === "number" || typeof r === "string") return String(r);
  return null;
}

/**
 * Cria um Contato (crm.contact.add) com nome/telefone/email.
 * No Bitrix, telefone e e-mail pertencem ao CONTATO (o Deal não tem campos
 * PHONE/EMAIL nativos — verificado via crm.deal.fields). Por isso os dados de
 * contato precisam morar aqui e o deal apenas referencia via CONTACT_ID.
 * @param {object} args
 * @param {string} args.nome
 * @param {string} [args.telefone] E.164
 * @param {string} [args.email]
 * @returns {Promise<string|null>} contactId
 */
export async function createContact(args) {
  // separa nome/sobrenome de forma simples (primeiro token = NAME, resto = LAST_NAME)
  const partes = (args.nome || "Lead").trim().split(/\s+/);
  const name = partes.shift() || "Lead";
  const lastName = partes.join(" ");
  const fields = {
    NAME: name,
    ...(lastName ? { LAST_NAME: lastName } : {}),
    SOURCE_ID,
    ...(ASSIGNED_BY_ID ? { ASSIGNED_BY_ID } : {}),
    ...(args.telefone ? { PHONE: [{ VALUE: args.telefone, VALUE_TYPE: "MOBILE" }] } : {}),
    ...(args.email ? { EMAIL: [{ VALUE: args.email, VALUE_TYPE: "WORK" }] } : {}),
  };
  const resp = await callBitrix("crm.contact.add", { fields }, { mockResult: `mock-contact-${Date.now()}` });
  return extractId(resp);
}

/**
 * Cria um negócio (crm.deal.add) e, quando houver dados de contato, cria um
 * Contato vinculado (CONTACT_ID) para que nome/telefone/email apareçam no card.
 * @param {object} args
 * @param {string} args.nome
 * @param {string} args.telefone  já normalizado (E.164) ou cru
 * @param {string} [args.email]
 * @param {string} [args.tipoCaso]
 * @param {string} [args.urgencia]
 * @param {boolean} [args.origemVoz]
 * @param {string} [args.etapaConversa]
 * @returns {Promise<string|null>} dealId
 */
export async function createDeal(args) {
  const title = `[DAP.IA] ${args.nome || "Lead"}${args.tipoCaso ? ` · ${args.tipoCaso}` : ""}`;

  // cria o contato primeiro (falha não bloqueia o deal; só perde o vínculo)
  let contactId = null;
  if (args.nome || args.telefone || args.email) {
    contactId = await createContact({ nome: args.nome, telefone: args.telefone, email: args.email }).catch(
      (e) => {
        console.error("[bitrix] createContact falhou (segue sem vínculo):", e.message);
        return null;
      }
    );
  }

  const fields = {
    TITLE: title,
    CATEGORY_ID,
    SOURCE_ID,
    ...(STAGE_ID ? { STAGE_ID } : {}),
    ...(ASSIGNED_BY_ID ? { ASSIGNED_BY_ID } : {}),
    ...(contactId ? { CONTACT_ID: contactId } : {}),
    ...buildCustomFields(args),
  };
  const resp = await callBitrix("crm.deal.add", { fields }, { mockResult: `mock-${Date.now()}` });
  return extractId(resp);
}

/**
 * Lê o CONTACT_ID vinculado a um negócio (crm.deal.get).
 * Retorna null se não houver contato ou em modo mock.
 * @param {string} dealId
 * @returns {Promise<string|null>}
 */
export async function getDealContactId(dealId) {
  if (!dealId) return null;
  const resp = await callBitrix("crm.deal.get", { id: dealId }, { mockResult: null });
  const cid = resp?.result?.CONTACT_ID;
  return cid ? String(cid) : null;
}

/**
 * Atualiza um negócio existente (crm.deal.update).
 * @param {string} dealId
 * @param {object} args mesmos campos de createDeal (parciais)
 */
export async function updateDeal(dealId, args) {
  const fields = {
    ...(args.tipoCaso ? { TITLE: `[DAP.IA] ${args.nome || "Lead"} · ${args.tipoCaso}` } : {}),
    ...(args.telefone ? { PHONE: [{ VALUE: args.telefone, VALUE_TYPE: "MOBILE" }] } : {}),
    ...(args.email ? { EMAIL: [{ VALUE: args.email, VALUE_TYPE: "WORK" }] } : {}),
    ...buildCustomFields(args),
  };
  const resp = await callBitrix(
    "crm.deal.update",
    { id: dealId, fields },
    { mockResult: true }
  );
  return resp;
}

/**
 * Move um negócio para outra etapa do funil (crm.deal.update com STAGE_ID).
 * Usado no agendamento para levar o card à etapa de agendamento.
 * @param {string} dealId
 * @param {string} stageId  ex.: "C600:PREPAYMENT_INVOI"
 */
export async function moveDealStage(dealId, stageId) {
  if (!stageId) return null;
  return callBitrix(
    "crm.deal.update",
    { id: dealId, fields: { STAGE_ID: stageId } },
    { mockResult: true }
  );
}

/**
 * Adiciona um comentário na timeline do negócio (crm.timeline.comment.add).
 * Usado para gravar o histórico da conversa / transcrição de voz.
 * @param {string} dealId
 * @param {string} comment
 */
export async function addTimelineComment(dealId, comment) {
  if (!comment || !comment.trim()) return null;
  return callBitrix(
    "crm.timeline.comment.add",
    {
      fields: {
        ENTITY_ID: dealId,
        ENTITY_TYPE: "deal",
        COMMENT: comment,
      },
    },
    { mockResult: `mock-comment-${Date.now()}` }
  );
}

/**
 * Cria uma atividade/compromisso (reunião remota) vinculada ao negócio
 * (crm.activity.add). Usado no agendamento. TYPE_ID=1 (meeting) + datas ISO.
 * O COMMUNICATIONS aponta preferencialmente para o CONTATO vinculado
 * (ENTITY_TYPE_ID 3); sem contato, cai no próprio deal (ENTITY_TYPE_ID 4).
 * @param {object} args
 * @param {string} args.dealId
 * @param {string} [args.contactId]  contato vinculado (destino da comunicação)
 * @param {string} args.subject
 * @param {string} args.startIso  ISO datetime
 * @param {string} args.endIso    ISO datetime
 * @param {string} [args.description]
 */
export async function addActivity(args) {
  // se o contato não veio, tenta descobrir o CONTACT_ID do próprio deal
  let contactId = args.contactId;
  if (!contactId && args.dealId) {
    contactId = await getDealContactId(args.dealId).catch(() => null);
  }
  const communications = contactId
    ? [{ ENTITY_ID: contactId, ENTITY_TYPE_ID: 3 }] // 3 = Contato
    : [{ ENTITY_ID: args.dealId, ENTITY_TYPE_ID: 4 }]; // 4 = Deal (fallback)
  const fields = {
    OWNER_TYPE_ID: 2, // 2 = deal
    OWNER_ID: args.dealId,
    TYPE_ID: 1, // 1 = meeting
    SUBJECT: args.subject,
    START_TIME: args.startIso,
    END_TIME: args.endIso,
    COMPLETED: "N",
    PRIORITY: 2, // média
    LOCATION: "Reunião remota (teleconferência)",
    COMMUNICATIONS: communications,
    ...(args.description ? { DESCRIPTION: args.description } : {}),
    ...(ASSIGNED_BY_ID ? { RESPONSIBLE_ID: ASSIGNED_BY_ID } : {}),
  };
  return callBitrix("crm.activity.add", { fields }, { mockResult: `mock-activity-${Date.now()}` });
}

/**
 * Publica um post no feed/atividade da empresa ("A DAP.IA captou um lead").
 * Usa log.blogpost.add (Activity Stream). Estrutura urgência/tipo no corpo.
 * @param {object} args
 * @param {string} args.nome
 * @param {string} [args.tipoCaso]
 * @param {string} [args.urgencia]
 * @param {boolean} [args.origemVoz]
 * @param {string} [args.dealId]
 */
export async function postLeadToFeed(args) {
  const linhas = [
    `🤖 A DAP.IA captou um lead`,
    "",
    `• Nome: ${args.nome || "—"}`,
    `• Tipo de caso: ${args.tipoCaso || "a classificar"}`,
    `• Urgência: ${(args.urgencia || "média").toUpperCase()}`,
    `• Descrito por voz: ${args.origemVoz ? "Sim" : "Não"}`,
    ...(args.dealId ? [`• Negócio: #${args.dealId}`] : []),
  ];
  return callBitrix(
    "log.blogpost.add",
    {
      POST_TITLE: `Novo lead DAP.IA${args.urgencia === "alta" ? " · URGENTE" : ""}`,
      POST_MESSAGE: linhas.join("\n"),
    },
    { mockResult: `mock-post-${Date.now()}` }
  );
}
