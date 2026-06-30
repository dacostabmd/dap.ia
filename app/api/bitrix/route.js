// POST /api/bitrix
//
// Rota de servidor que fala com o webhook REST do Bitrix. A URL do webhook
// (BITRIX_WEBHOOK_URL) NUNCA é exposta ao client — fica só aqui.
//
// Ações (campo `action`):
//   "create"   -> cria o negócio (crm.deal.add) + comentário com histórico.
//                 Retorna { dealId }.
//   "update"   -> atualização incremental/anti-abandono (crm.deal.update)
//                 usando o dealId existente. Atualiza comentário se enviado.
//   "schedule" -> cria atividade (crm.activity.add) vinculada ao deal +
//                 publica no feed "A DAP.IA captou um lead" (log.blogpost.add).
//
// Em modo mock (sem webhook) tudo responde sucesso simulado e loga o payload.

import {
  createDeal,
  updateDeal,
  addTimelineComment,
  addActivity,
  postLeadToFeed,
} from "@/lib/bitrix";
import { isBitrixConfigured } from "@/lib/bitrix-config";
import { isValidBRPhone, normalizeBRPhone, isValidEmail, isValidName } from "@/lib/validation";

function bad(message, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/**
 * Monta um comentário de timeline a partir do histórico da conversa.
 * Sem limite artificial de caracteres (transcrição de voz pode ser longa).
 * @param {Array<{role:string, content:string, voice?:boolean}>} historico
 * @param {boolean} houveVoz
 */
function historicoParaComentario(historico, houveVoz) {
  if (!Array.isArray(historico) || historico.length === 0) return "";
  const linhas = historico.map((m) => {
    const quem = m.role === "user" ? "Cliente" : "DAP.IA";
    const tag = m.voice ? " 🎙️(voz)" : "";
    return `${quem}${tag}: ${m.content}`;
  });
  const cabecalho = houveVoz
    ? "📝 Histórico da conversa (o caso foi descrito por VOZ — transcrição completa abaixo):"
    : "📝 Histórico da conversa:";
  return `${cabecalho}\n\n${linhas.join("\n")}`;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return bad("Corpo da requisição inválido.");
  }

  const { action = "create" } = body;

  try {
    // ---------- CREATE ----------
    if (action === "create") {
      const { nome, telefone, email, tipoCaso, urgencia, historico, origemVoz } = body;

      if (!isValidName(nome)) return bad("Nome inválido.");
      if (!isValidBRPhone(telefone)) return bad("Telefone inválido. Use um número brasileiro válido.");
      if (email && !isValidEmail(email)) return bad("E-mail inválido.");

      const telefoneNorm = normalizeBRPhone(telefone);
      const houveVoz = Boolean(origemVoz);

      const dealId = await createDeal({
        nome,
        telefone: telefoneNorm,
        email: email || "",
        tipoCaso: tipoCaso || "",
        urgencia: urgencia || "",
        origemVoz: houveVoz,
        etapaConversa: "Diagnóstico / contato capturado",
      });

      const comentario = historicoParaComentario(historico, houveVoz);
      if (dealId && comentario) {
        // não falha a criação se o comentário der erro
        await addTimelineComment(dealId, comentario).catch((e) =>
          console.error("[bitrix] comentário falhou (segue):", e.message)
        );
      }

      return Response.json({ ok: true, dealId, mock: !isBitrixConfigured });
    }

    // ---------- UPDATE (captura progressiva) ----------
    if (action === "update") {
      const { dealId, nome, telefone, email, tipoCaso, urgencia, historico, origemVoz, etapaConversa } = body;
      if (!dealId) return bad("dealId é obrigatório para update.");
      if (telefone && !isValidBRPhone(telefone)) return bad("Telefone inválido.");
      if (email && !isValidEmail(email)) return bad("E-mail inválido.");

      await updateDeal(dealId, {
        nome: nome || "",
        telefone: telefone ? normalizeBRPhone(telefone) : "",
        email: email || "",
        tipoCaso: tipoCaso || "",
        urgencia: urgencia || "",
        origemVoz: origemVoz !== undefined ? Boolean(origemVoz) : undefined,
        etapaConversa: etapaConversa || "",
      });

      const comentario = historicoParaComentario(historico, Boolean(origemVoz));
      if (comentario) {
        await addTimelineComment(dealId, comentario).catch((e) =>
          console.error("[bitrix] comentário (update) falhou (segue):", e.message)
        );
      }

      return Response.json({ ok: true, dealId, mock: !isBitrixConfigured });
    }

    // ---------- SCHEDULE (agendamento) ----------
    if (action === "schedule") {
      const { dealId, nome, tipoCaso, urgencia, origemVoz, startIso, endIso, label } = body;
      if (!dealId) return bad("dealId é obrigatório para agendamento.");
      if (!startIso || !endIso) return bad("startIso e endIso são obrigatórios.");

      const subject = `Atendimento DAP.IA — ${nome || "Lead"}${tipoCaso ? ` (${tipoCaso})` : ""}`;
      await addActivity({
        dealId,
        subject,
        startIso,
        endIso,
        description: `Horário escolhido pelo lead no chat: ${label || startIso}.`,
      });

      // feed da empresa: "A DAP.IA captou um lead"
      await postLeadToFeed({ nome, tipoCaso, urgencia, origemVoz, dealId }).catch((e) =>
        console.error("[bitrix] post no feed falhou (segue):", e.message)
      );

      return Response.json({ ok: true, dealId, scheduled: true, mock: !isBitrixConfigured });
    }

    return bad(`Ação desconhecida: ${action}`);
  } catch (error) {
    console.error("[api/bitrix] erro:", error);
    return Response.json(
      { ok: false, error: "Não foi possível registrar agora. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
