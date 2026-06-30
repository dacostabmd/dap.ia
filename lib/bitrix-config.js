// Configuração centralizada da integração com o Bitrix24.
//
// Os IDs de campos customizados (UF_CRM_*) e de categoria/estágio do funil são
// ESPECÍFICOS do seu portal Bitrix. Em vez de espalhá-los pelo código, eles vivem
// aqui e podem ser sobrescritos por variáveis de ambiente — assim você troca os
// valores reais sem caçar pelo código.
//
// === Onde encontrar cada ID no seu Bitrix ===
// 1. Campos customizados de Negócio (UF_CRM_*):
//    CRM > Configurações > Campos personalizados > (selecionar Negócios),
//    ou inspecione a resposta de crm.deal.fields no seu webhook REST.
// 2. ID de categoria do funil (CATEGORY_ID):
//    crm.category.list?entityTypeId=2  (deals = 2). 0 = funil padrão.
// 3. IDs de estágio (STAGE_ID):
//    crm.dealcategory.stage.list?id=<CATEGORY_ID> — ex.: "C1:NEW".
//
// Enquanto você não preencher, ficam placeholders seguros. A rota /api/bitrix
// só envia um campo UF_CRM_* se ele estiver de fato configurado (ver buildDealFields).

/** Lê env var com fallback. */
function env(key, fallback) {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
}

// URL base do webhook REST de entrada do Bitrix.
// Formato: https://SEU.bitrix24.com.br/rest/<user_id>/<token>/
// NUNCA exponha no client. Lida apenas em rotas de servidor.
export const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL || "";

// true quando há webhook configurado; caso contrário a rota opera em modo mock.
export const isBitrixConfigured = Boolean(BITRIX_WEBHOOK_URL);

// Funil/estágio onde os leads da DAP.IA entram.
export const CATEGORY_ID = env("BITRIX_CATEGORY_ID", "0");
export const STAGE_ID = env("BITRIX_STAGE_ID", "");
// Origem do negócio (SOURCE_ID). "WEB" é nativo; ajuste se criou origem própria.
export const SOURCE_ID = env("BITRIX_SOURCE_ID", "WEB");
// ID do responsável (assigned). Vazio = Bitrix decide pela regra do funil.
export const ASSIGNED_BY_ID = env("BITRIX_ASSIGNED_BY_ID", "");

// Mapa de campos customizados (UF_CRM_*).
// Os valores abaixo são PLACEHOLDERS — substitua pelos códigos reais do seu portal
// (ou defina as env vars). Um campo com valor placeholder NÃO é enviado ao Bitrix
// (ver isPlaceholder), evitando erro "field not found".
export const FIELDS = {
  // WhatsApp/telefone informado no formulário de captura.
  whatsapp: env("BITRIX_UF_WHATSAPP", "UF_CRM_PLACEHOLDER_WHATSAPP"),
  // Tipo de caso detectado (ex.: "Busca e Apreensão", "Juros Abusivos").
  tipoCaso: env("BITRIX_UF_TIPO_CASO", "UF_CRM_PLACEHOLDER_TIPO_CASO"),
  // Urgência classificada (baixa | media | alta).
  urgencia: env("BITRIX_UF_URGENCIA", "UF_CRM_PLACEHOLDER_URGENCIA"),
  // Marca "true" quando o caso foi descrito por voz (microfone).
  origemVoz: env("BITRIX_UF_ORIGEM_VOZ", "UF_CRM_PLACEHOLDER_ORIGEM_VOZ"),
  // Etapa da conversa no momento da última atualização.
  etapaConversa: env("BITRIX_UF_ETAPA", "UF_CRM_PLACEHOLDER_ETAPA"),
};

const PLACEHOLDER_RE = /PLACEHOLDER/;

/** Um código de campo ainda é placeholder (não configurado)? */
export function isPlaceholder(fieldCode) {
  return !fieldCode || PLACEHOLDER_RE.test(fieldCode);
}

/**
 * Monta o objeto de campos para crm.deal.add/update, incluindo apenas os
 * campos customizados que estão de fato configurados (não-placeholder) e que
 * têm valor. Campos nativos (TITLE etc.) são tratados por quem chama.
 * @param {{tipoCaso?:string, urgencia?:string, whatsapp?:string, origemVoz?:boolean, etapaConversa?:string}} data
 * @returns {Record<string, string>}
 */
export function buildCustomFields(data) {
  const out = {};
  const add = (code, value) => {
    if (isPlaceholder(code)) return;
    if (value === undefined || value === null || value === "") return;
    out[code] = String(value);
  };
  add(FIELDS.whatsapp, data.whatsapp);
  add(FIELDS.tipoCaso, data.tipoCaso);
  add(FIELDS.urgencia, data.urgencia);
  add(FIELDS.etapaConversa, data.etapaConversa);
  if (data.origemVoz !== undefined) add(FIELDS.origemVoz, data.origemVoz ? "Y" : "N");
  return out;
}
