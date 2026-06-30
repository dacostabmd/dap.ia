// POST /api/chat  ->  { reply: string, sources: string[], meta?: object }
//
// Encaminha a mensagem ATUAL + o histórico recente da conversa para a API RAG
// e repassa, quando presente, um envelope `meta` estruturado que o backend usa
// para orquestrar o recepcionista digital (ver docs/backend-rag-prompt.md):
//   meta = { stage, tipoCaso, urgencia, readyForForm, diagnosticoParcial,
//            descricaoPorVoz, extracted: { nome, telefone, email } }
//
// O histórico é limitado para economizar tokens de contexto (CLAUDE.md).

const MAX_HISTORY = 12; // últimas N mensagens enviadas ao RAG
const TIMEOUT_MS = 20000;

export async function POST(req) {
  try {
    const { message, history, sessionId } = await req.json();
    const apiUrl = process.env.RAG_API_URL || "http://localhost:8000/webhook/chat-ia";
    const apiKey = process.env.RAG_API_KEY;

    const headers = { "Content-Type": "application/json" };
    if (apiKey && apiKey !== "YOUR_BEARER_TOKEN_HERE") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // histórico compacto: só role + conteúdo, limitado às últimas MAX_HISTORY.
    const historico = Array.isArray(history)
      ? history
          .slice(-MAX_HISTORY)
          .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: String(m.content ?? "") }))
          .filter((m) => m.content.trim().length > 0)
      : [];

    const payload = {
      mensagem: message,
      session_id: sessionId || `session-web-${Date.now()}`,
      // histórico em duas chaves para compatibilidade com diferentes backends
      historico,
      history: historico,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res;
    try {
      res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw new Error(`RAG API returned status: ${res.status}`);
    }

    const data = await res.json();

    // meta pode vir em data.meta (preferido) ou solto na raiz (compat).
    const meta = data.meta ?? extractLooseMeta(data);

    return Response.json({
      reply: data.resposta ?? data.reply ?? data.answer ?? data.text ?? data.response ?? "",
      sources: data.sources ?? data.fontes ?? [],
      ...(meta ? { meta } : {}),
    });
  } catch (error) {
    // Diagnóstico explícito da causa (aparece no terminal do `next dev`):
    const apiUrl = process.env.RAG_API_URL || "http://localhost:8000/webhook/chat-ia";
    if (error?.name === "AbortError") {
      console.error(`[api/chat] timeout (${TIMEOUT_MS}ms) ao chamar ${apiUrl}`);
    } else if (error?.cause?.code === "ECONNREFUSED" || /fetch failed/i.test(error?.message)) {
      console.error(
        `[api/chat] não foi possível conectar em ${apiUrl} — backend no ar? URL correta em RAG_API_URL?`,
        error?.cause?.code || error?.message
      );
    } else {
      console.error("[api/chat] erro ao comunicar com a API RAG:", error);
    }
    return Response.json({
      reply:
        "Desculpe, não consegui obter resposta do assistente no momento. Por favor, tente novamente mais tarde.",
      sources: [],
    });
  }
}

// Coleta campos de meta que alguns backends devolvem soltos na raiz da resposta.
function extractLooseMeta(data) {
  const keys = ["stage", "tipoCaso", "urgencia", "readyForForm", "diagnosticoParcial", "descricaoPorVoz", "extracted"];
  const found = {};
  for (const k of keys) {
    if (data[k] !== undefined) found[k] = data[k];
  }
  return Object.keys(found).length ? found : null;
}
