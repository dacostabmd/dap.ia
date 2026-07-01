"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { buildFallbackMeta } from "@/lib/lead-heuristics";
import { isValidBRPhone, isValidEmail, isValidName, formatBRPhone } from "@/lib/validation";

const CHIPS = [
  { label: "Veículo apreendido", text: "Tive meu veículo apreendido por atraso no financiamento" },
  { label: "Juros abusivos", text: "Meus juros estão abusivos?" },
  { label: "Demissão sem justa causa", text: "Fui demitido sem justa causa, quais meus direitos?" },
  { label: "Nome negativado", text: "Fui negativado de forma indevida no SPC/Serasa, o que fazer?" },
  { label: "Aposentadoria / INSS", text: "Meu benefício do INSS foi negado ou está com valor errado, tenho direito?" },
  { label: "Divórcio e pensão", text: "Preciso de orientação sobre divórcio, guarda e pensão alimentícia" },
  { label: "Inventário e herança", text: "Como funciona o inventário e a partilha de bens de uma herança?" },
  { label: "Golpe bancário", text: "Caí em um golpe bancário, o banco precisa me ressarcir?" },
  { label: "Erro médico", text: "Sofri um erro médico ou negativa de atendimento, quais meus direitos?" },
];

const GREETING = {
  id: 1,
  role: "bot",
  done: true,
  showSources: false,
  shownText:
    "Olá, seja bem-vindo(a) ao DAP Advocacia. Sou a DAP.IA, recepcionista digital do escritório. Vou te ouvir com atenção, entender sua situação e organizar tudo para que um de nossos advogados já receba o caso pronto para conversar com você. Pode me contar o que aconteceu?",
  sources: [],
};

// Etapas do indicador de progresso (item 6).
const STEPS = [
  { key: "entendendo", label: "Entendendo seu caso" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "advogado", label: "Falar com advogado" },
];
const STEP_INDEX = { entendendo: 0, diagnostico: 1, advogado: 2 };

// Horários oferecidos no agendamento (item 4). Offsets calculados no clique.
// Nº de dias a partir de hoje até o próximo dia da semana `weekday` (0=dom..6=sáb)
// na SEMANA SEGUINTE. Ex.: se hoje é terça, nextWeekdayOffset(1) aponta para a
// segunda-feira da próxima semana (não para amanhã).
function nextWeekdayOffset(weekday) {
  const hoje = brtWeekday();
  // dias até a próxima segunda (início da semana que vem)
  const ateProxSegunda = ((1 - hoje + 7) % 7) || 7;
  // desloca dentro da semana que vem (segunda = 0)
  return ateProxSegunda + ((weekday - 1 + 7) % 7);
}

// Dia da semana (0=dom..6=sáb) de hoje no relógio de Brasília.
function brtWeekday() {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(new Date());
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? new Date().getDay();
}

// Horários fixos de hoje/amanhã. Os da semana seguinte são calculados no render
// (buildSlots) para não "congelar" o offset no carregamento do módulo.
const BASE_SLOTS = [
  { id: "hoje-14", label: "Hoje, 14h", dayOffset: 0, hour: 14 },
  { id: "hoje-16", label: "Hoje, 16h", dayOffset: 0, hour: 16 },
  { id: "amanha-10", label: "Amanhã, 10h", dayOffset: 1, hour: 10 },
];

// Fuso do escritório/cliente (Brasília, UTC−03:00, sem horário de verão desde 2019).
// Ancorar o agendamento neste offset evita que o horário "escorregue" conforme o
// fuso do navegador ou do servidor do Bitrix — "10h" significa 10h em Brasília.
const BRT_OFFSET = "-03:00";
const pad2 = (n) => String(n).padStart(2, "0");

// Partes de data (ano/mês/dia) de "agora" no relógio de Brasília, independente
// do fuso do navegador. Usa Intl para não errar perto da meia-noite.
function brtDateParts() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [{ value: y }, , { value: m }, , { value: d }] = fmt.formatToParts(new Date());
  return { y: Number(y), m: Number(m), d: Number(d) };
}

/**
 * Data/hora "de hoje (em Brasília) + dayOffset, às `hour`h" como { iso, ms }.
 * `iso` traz o offset explícito −03:00; `ms` é o instante absoluto (para comparar
 * com agora). Somar o dayOffset via Date.UTC normaliza viradas de mês/ano.
 */
function slotInstant(dayOffset, hour) {
  const { y, m, d } = brtDateParts();
  // usa Date.UTC só para normalizar o calendário (virada de mês/ano); as partes
  // resultantes são lidas de volta e re-rotuladas como horário de Brasília.
  const cal = new Date(Date.UTC(y, m - 1, d + dayOffset));
  const iso = `${cal.getUTCFullYear()}-${pad2(cal.getUTCMonth() + 1)}-${pad2(cal.getUTCDate())}T${pad2(hour)}:00:00${BRT_OFFSET}`;
  return { iso, ms: Date.parse(iso) };
}

function buildSlots() {
  const all = [
    ...BASE_SLOTS,
    { id: "prox-seg-10", label: "Próx. segunda, 10h", dayOffset: nextWeekdayOffset(1), hour: 10 },
    { id: "prox-qua-15", label: "Próx. quarta, 15h", dayOffset: nextWeekdayOffset(3), hour: 15 },
    { id: "prox-sex-11", label: "Próx. sexta, 11h", dayOffset: nextWeekdayOffset(5), hour: 11 },
  ];
  // não oferece horários que já passaram (ex.: "Hoje, 14h" às 15h)
  const agora = Date.now();
  return all.filter((s) => slotInstant(s.dayOffset, s.hour).ms > agora);
}

export default function Chat() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [flashId, setFlashId] = useState(null); // id da bolha que faz o flash dourado ao concluir

  // ---- recepcionista digital ----
  const [meta, setMeta] = useState({ stage: "entendendo", tipoCaso: "", urgencia: "baixa", readyForForm: false, diagnosticoParcial: "" });
  const [phase, setPhase] = useState("chatting"); // chatting | form | scheduling | done
  const [consent, setConsent] = useState(false);
  const [lead, setLead] = useState({ nome: "", telefone: "", email: "", infoExtra: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formBusy, setFormBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [rateLimited, setRateLimited] = useState(false); // atingiu 4 perguntas/24h

  const listRef = useRef(null);
  const timers = useRef([]);
  const recognitionRef = useRef(null);
  const voiceUsedRef = useRef(false); // o caso foi descrito por voz?
  const dealIdRef = useRef(null); // espelho síncrono p/ updates
  const openFormAfterRef = useRef(null); // id da msg após cuja digitação o form deve abrir
  const sessionId = useRef(`session-web-${Math.round(performance.now())}-${messages.length}`);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // ----------------------------------------------------------------
  // Reconhecimento de voz (INALTERADO em comportamento)
  // ----------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
    };

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          voiceUsedRef.current = true; // marca que houve descrição por voz
          setInput((prev) => prev + e.results[i][0].transcript + " ");
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognitionRef.current?.abort(); } catch { }
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  // perguntas enviadas pelos botões do carrossel "Perguntar à DAP.IA"
  useEffect(() => {
    const handler = (e) => send(e.detail);
    window.addEventListener("dap:ask", handler);
    return () => window.removeEventListener("dap:ask", handler);
  });

  // ----------------------------------------------------------------
  // Entrega a resposta do bot para o RevealedText, que faz a revelação
  // caractere a caractere guiada pelas quebras de linha (a 2ª linha só
  // aparece quando a 1ª enche). Aqui só marcamos a mensagem como
  // `animate: true` e liberamos o composer; o flash/fontes são disparados
  // por finishReveal quando o RevealedText termina.
  // ----------------------------------------------------------------
  // Chamado pelo RevealedText quando a digitação termina: revela as
  // fontes consultadas e dispara o flash dourado na borda da bolha.
  const finishReveal = useCallback((id, sources) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, showSources: true, sources: sources ?? m.sources } : m)));
    setFlashId(id);
    // se esta era a mensagem que precede a captura, abre o formulário agora que
    // ela terminou de ser lida/digitada (item: form não deve aparecer cedo demais)
    if (openFormAfterRef.current === id) {
      openFormAfterRef.current = null;
      timers.current.push(setTimeout(() => setPhase("form"), 350));
    }
  }, []);

  const typeOut = useCallback((id, full, sources) => {
    setSending(false);
    setMessages((ms) =>
      ms.map((m) => (m.id === id ? { ...m, shownText: full, sources, animate: full.length > 0, showSources: false } : m))
    );
    if (!full) {
      // sem texto: nada a animar, revela fontes na hora e resolve a abertura
      // do formulário (não há texto para ler, então não faz sentido esperar)
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, showSources: true } : m)));
      finishReveal(id, sources);
    }
  }, [finishReveal]);

  // ----------------------------------------------------------------
  // Áudio TTS (INALTERADO)
  // ----------------------------------------------------------------
  const useFallbackSynthesis = useCallback((text) => {
    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const speakText = useCallback(async (text) => {
    if (!text) return;

    setIsSpeaking(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => useFallbackSynthesis(text);
          audio.play().catch(() => useFallbackSynthesis(text));
          return;
        }
      }
    } catch { }

    useFallbackSynthesis(text);
  }, [useFallbackSynthesis]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.");
        return;
      }
      return;
    }
    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch {
      setIsListening(false);
    }
  }, [isListening]);

  // ----------------------------------------------------------------
  // Helpers de histórico p/ Bitrix e RAG
  // ----------------------------------------------------------------
  const buildHistory = useCallback(
    (extra = []) => {
      const fromMessages = messages
        .filter((m) => (m.role === "user" || m.role === "bot") && (m.shownText || "").trim() && !m.isThinking)
        .map((m) => ({ role: m.role === "user" ? "user" : "bot", content: m.shownText, voice: m.voice }));
      return [...fromMessages, ...extra];
    },
    [messages]
  );

  // Atualização incremental do card (item 3 — anti-abandono).
  const progressiveUpdate = useCallback(
    (latestMeta, historico) => {
      const id = dealIdRef.current;
      if (!id) return; // só atualiza se o deal já existe (criado no submit do form)
      fetch("/api/bitrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          dealId: id,
          nome: lead.nome,
          tipoCaso: latestMeta.tipoCaso,
          urgencia: latestMeta.urgencia,
          origemVoz: voiceUsedRef.current,
          etapaConversa: STEPS[STEP_INDEX[latestMeta.stage] ?? 0]?.label,
          historico,
        }),
      }).catch((e) => console.error("update progressivo falhou:", e));
    },
    [lead.nome]
  );

  // ----------------------------------------------------------------
  // Envio de mensagem
  // ----------------------------------------------------------------
  const send = useCallback(
    (raw) => {
      const text = (raw ?? input).trim();
      if (!text || sending || rateLimited) return;
      const usedVoice = voiceUsedRef.current;
      const base = Math.round(performance.now());
      setMessages((ms) => [...ms, { id: base, role: "user", shownText: text, done: true, voice: usedVoice }]);
      setInput("");
      setSending(true);
      setBannerError("");

      const thinkId = base + 1;
      timers.current.push(
        setTimeout(async () => {
          setMessages((ms) => [
            ...ms,
            { id: thinkId, role: "bot", isThinking: true, shownText: "", sources: [], showSources: false },
          ]);
          let reply = "";
          let sources = [];
          let serverMeta = {};
          let limitHit = false;
          // histórico inclui a mensagem que acabou de ser enviada
          const historico = buildHistory([{ role: "user", content: text, voice: usedVoice }]);
          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: text, history: historico, sessionId: sessionId.current }),
            });
            const data = await res.json();
            reply = data.reply || "";
            sources = data.sources || [];
            serverMeta = data.meta || {};
            // limite de perguntas por IP atingido (429): bloqueia o chat por 24h
            if (res.status === 429 || data.rateLimited) {
              limitHit = true;
            }
          } catch {
            reply = "Desculpe, não consegui responder agora. Tente novamente em instantes.";
          }

          // limite atingido: mostra a mensagem, trava o composer e encerra —
          // não recomputa meta nem abre formulário (bloqueio total por 24h).
          if (limitHit) {
            setRateLimited(true);
            setMessages((ms) => ms.map((m) => (m.id === thinkId ? { ...m, isThinking: false } : m)));
            typeOut(thinkId, reply, []);
            return;
          }

          // recomputa meta (servidor tem prioridade; heurística preenche o resto)
          const hasContact = Boolean(dealIdRef.current);
          const nextMeta = buildFallbackMeta(historico, serverMeta, { hasContact });
          setMeta(nextMeta);

          // captura progressiva do card já existente
          progressiveUpdate(nextMeta, historico);

          // se o backend extraiu contato, pré-preenche o formulário
          if (serverMeta.extracted) {
            setLead((l) => ({
              nome: l.nome || serverMeta.extracted.nome || "",
              telefone: l.telefone || serverMeta.extracted.telefone || "",
              email: l.email || serverMeta.extracted.email || "",
            }));
          }

          // marca para abrir o formulário de captura SÓ quando esta resposta
          // terminar de ser digitada (ver finishReveal) — evita o form surgir
          // antes de o usuário conseguir ler a mensagem da IA.
          if (nextMeta.readyForForm && !hasContact && phase === "chatting") {
            openFormAfterRef.current = thinkId;
          }

          setMessages((ms) => ms.map((m) => (m.id === thinkId ? { ...m, isThinking: false } : m)));
          typeOut(thinkId, reply, sources);
        }, 900)
      );
    },
    [input, sending, rateLimited, typeOut, buildHistory, progressiveUpdate, phase]
  );

  // ----------------------------------------------------------------
  // Formulário de captura (itens 1, 7, 13)
  // ----------------------------------------------------------------
  const validateForm = useCallback(() => {
    const errs = {};
    if (!isValidName(lead.nome)) errs.nome = "Informe seu nome.";
    if (!isValidBRPhone(lead.telefone)) errs.telefone = "WhatsApp inválido. Ex: (21) 99999-8888";
    if (lead.email && !isValidEmail(lead.email)) errs.email = "E-mail inválido.";
    if (!consent) errs.consent = "Marque o aceite para continuar.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [lead, consent]);

  const submitLead = useCallback(async () => {
    if (formBusy) return;
    if (!validateForm()) return;
    setFormBusy(true);
    setBannerError("");

    const historico = buildHistory();
    try {
      const res = await fetch("/api/bitrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          nome: lead.nome,
          telefone: lead.telefone,
          email: lead.email,
          infoExtra: lead.infoExtra,
          tipoCaso: meta.tipoCaso,
          urgencia: meta.urgencia,
          origemVoz: voiceUsedRef.current,
          historico,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao registrar.");

      if (data.dealId) {
        dealIdRef.current = data.dealId;
      }
      setMeta((m) => ({ ...m, stage: "advogado" }));
      setPhase("scheduling");

      // confirma no chat
      const okId = Math.round(performance.now()) + 7;
      setMessages((ms) => [
        ...ms,
        {
          id: okId,
          role: "bot",
          done: true,
          showSources: false,
          sources: [],
          shownText: `Perfeito, ${lead.nome.split(" ")[0]}. Já registrei seu contato com segurança. Para adiantar, escolha um horário para um de nossos advogados falar com você:`,
        },
      ]);
    } catch (e) {
      setBannerError(e.message || "Não foi possível registrar agora. Tente novamente.");
    } finally {
      setFormBusy(false);
    }
  }, [formBusy, validateForm, buildHistory, lead, meta]);

  // ----------------------------------------------------------------
  // Agendamento (item 4)
  // ----------------------------------------------------------------
  const pickSlot = useCallback(
    async (slot) => {
      if (scheduleBusy) return;
      setScheduleBusy(true);
      setBannerError("");

      // calcula início/fim ancorados no fuso de Brasília (evita escorregar de fuso)
      const { iso: startIso, ms: startMs } = slotInstant(slot.dayOffset, slot.hour);
      const endIso = new Date(startMs + 30 * 60 * 1000).toISOString();

      // guarda contra escolher um horário que acabou de passar (o backend também valida)
      if (startMs <= Date.now()) {
        setScheduleBusy(false);
        setBannerError("Esse horário já passou. Escolha outro, por favor.");
        return;
      }

      try {
        const res = await fetch("/api/bitrix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "schedule",
            dealId: dealIdRef.current,
            nome: lead.nome,
            tipoCaso: meta.tipoCaso,
            urgencia: meta.urgencia,
            origemVoz: voiceUsedRef.current,
            startIso,
            endIso,
            label: slot.label,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao agendar.");

        setPhase("done");
        const okId = Math.round(performance.now()) + 9;
        setMessages((ms) => [
          ...ms,
          {
            id: okId,
            role: "bot",
            done: true,
            showSources: false,
            sources: [],
            shownText: `Combinado! Um advogado falará com você ${slot.label.toLowerCase()}. Você receberá a confirmação no WhatsApp informado. Se precisar, pode continuar tirando dúvidas por aqui.`,
          },
        ]);
      } catch (e) {
        setBannerError(e.message || "Não foi possível agendar agora. Tente novamente.");
      } finally {
        setScheduleBusy(false);
      }
    },
    [scheduleBusy, lead.nome, meta]
  );

  const currentStep = STEP_INDEX[meta.stage] ?? 0;
  const composerDisabled = sending || rateLimited;

  return (
    <div id="chat" className="relative w-full max-w-5xl">
      <div className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(201,168,106,.22),transparent_70%)] blur-2xl animate-glow" />
      <div className="relative overflow-hidden rounded-[20px] shadow-[0_30px_70px_rgba(6,15,23,.5)]">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-[rgba(201,168,106,.2)] bg-navy px-[18px] py-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-gold bg-[rgba(201,168,106,.08)] font-serif text-sm font-bold text-gold">
            IA
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-navy bg-[#5fc28a]" />
          </div>
          <div className="flex-1 leading-tight">
            <div className="font-serif text-[15px] font-semibold text-white">DAP.IA</div>
            <div className="text-[11.5px] text-white/55">Online · 24/7</div>
          </div>
          <span className="hidden sm:block rounded-md border border-[rgba(201,168,106,.35)] px-2 py-1 font-mono text-[9.5px] tracking-[1.2px] text-gold">
            Supervisionado por advogados · OAB/RJ
          </span>
        </div>

        {/* indicador de progresso (item 6) */}
        <div className="flex justify-center border-b border-[rgba(201,168,106,.15)] bg-navy px-[18px] py-[10px]">
          <div className="flex w-full max-w-[700px] items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {STEPS.map((s, i) => {
              const reached = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={s.key} className={`flex items-center gap-2 ${i < STEPS.length - 1 ? "flex-1" : "shrink-0"}`}>
                  <div className="flex shrink-0 items-center gap-[7px]">
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-200 ease-out ${reached
                        ? "border-gold bg-gold text-navy"
                        : "border-white/25 bg-transparent text-white/40"
                        }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`whitespace-nowrap text-[10px] tracking-[.3px] transition-colors duration-200 ease-out ${active ? "font-semibold text-gold" : reached ? "text-white/70 hidden sm:block" : "text-white/40 hidden sm:block"
                        }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className={`h-px w-full min-w-[20px] flex-1 transition-colors duration-200 ease-out ${i < currentStep ? "bg-gold/60" : "bg-white/15"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-porcelain-grain">

          {/* messages */}
          <div ref={listRef} className="scrl flex h-[452px] flex-col gap-[14px] overflow-y-auto px-[18px] pb-[6px] pt-[18px]">
            {messages.map((m) =>
              m.role === "bot" ? (
                <div key={m.id} className="flex items-start gap-[9px] animate-msg-in group">
                  <div className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[1.4px] border-gold bg-[rgba(201,168,106,.1)] font-serif text-[11px] font-bold text-golddk">
                    IA
                  </div>
                  <div className="flex items-start gap-2">
                    <div
                      onAnimationEnd={() => setFlashId((cur) => (cur === m.id ? null : cur))}
                      className={`max-w-[65%] rounded-[4px_14px_14px_14px] border border-[rgba(15,34,51,.08)] bg-porcelain-grain px-[14px] py-3 shadow-[0_2px_8px_rgba(6,15,23,.06)] ${flashId === m.id ? "flash-border-gold" : ""}`}
                    >
                      {m.isThinking ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 0" }}>
                          <span style={{ display: "block", width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#9c7b3f", animation: "typingBounce 1.1s ease-in-out 0s infinite" }} />
                          <span style={{ display: "block", width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#9c7b3f", animation: "typingBounce 1.1s ease-in-out 0.15s infinite" }} />
                          <span style={{ display: "block", width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#9c7b3f", animation: "typingBounce 1.1s ease-in-out 0.3s infinite" }} />
                        </div>
                      ) : (
                        <>
                          <div className="text-left text-[14px] leading-[1.62] text-[#22323f]">
                            {m.animate ? (
                              <RevealedText text={m.shownText} onDone={() => finishReveal(m.id, m.sources)} />
                            ) : (
                              m.shownText
                            )}
                          </div>
                          {m.showSources && m.sources?.length > 0 && (
                            <div className="mt-[11px] border-t border-dashed border-[rgba(15,34,51,.12)] pt-[10px]">
                              <div className="mb-[7px] font-mono text-[9px] uppercase tracking-[1.4px] text-golddk">
                                Fontes consultadas
                              </div>
                              <div className="flex flex-wrap gap-[6px]">
                                {m.sources.map((src, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-[5px] rounded-md border border-[rgba(201,168,106,.35)] bg-[rgba(201,168,106,.12)] px-2 py-1 font-mono text-[10.5px] text-navy2"
                                  >
                                    <span className="text-golddk">§</span>
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!m.isThinking && m.shownText && (
                      <button
                        onClick={() => speakText(m.shownText)}
                        disabled={isSpeaking}
                        aria-label="Ouvir mensagem"
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[rgba(201,168,106,.1)] text-golddk transition-all duration-200 ease-out hover:bg-[rgba(201,168,106,.2)] disabled:opacity-50"
                        title="Ouvir com áudio"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm4-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-end animate-msg-in">
                  <div className="max-w-[78%] rounded-[14px_4px_14px_14px] bg-navy2 px-[14px] py-[11px] text-left text-[14px] leading-[1.55] text-white shadow-[0_3px_10px_rgba(6,15,23,.28)]">
                    {m.voice && (
                      <span className="mb-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[1px] text-gold/80">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /></svg>
                        por voz
                      </span>
                    )}
                    {m.shownText}
                  </div>
                </div>
              )
            )}

            {/* formulário de captura inline (itens 1, 7, 13) */}
            {phase === "form" && (
              <LeadForm
                lead={lead}
                setLead={setLead}
                errors={formErrors}
                consent={consent}
                setConsent={setConsent}
                busy={formBusy}
                onSubmit={submitLead}
                diagnostico={meta.diagnosticoParcial}
              />
            )}

            {/* agendamento (item 4) */}
            {phase === "scheduling" && (
              <div className="animate-msg-in ml-[39px] rounded-[14px] border border-[rgba(201,168,106,.3)] bg-porcelain-grain p-[14px] shadow-[0_2px_8px_rgba(6,15,23,.06)]">
                <div className="mb-[10px] font-mono text-[9.5px] uppercase tracking-[1.4px] text-golddk">
                  Escolha um horário
                </div>
                <div className="flex flex-wrap gap-[7px]">
                  {buildSlots().map((s) => (
                    <button
                      key={s.id}
                      onClick={() => pickSlot(s)}
                      disabled={scheduleBusy}
                      className="cursor-pointer rounded-full border border-[rgba(15,34,51,.16)] bg-card px-[14px] py-[8px] text-[12.5px] font-medium text-navy2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-gold hover:bg-[rgba(201,168,106,.15)] disabled:cursor-default disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bannerError && (
              <div className="ml-[39px] rounded-[10px] border border-[rgba(239,68,68,.4)] bg-[rgba(239,68,68,.08)] px-[13px] py-[9px] text-[12.5px] text-[#b42318]">
                {bannerError}
              </div>
            )}
          </div>

          {/* chips (ocultos quando o limite de perguntas foi atingido) */}
          {!rateLimited && (
            <div className="flex flex-wrap gap-[7px] px-[18px] pb-3 pt-[6px]">
              {CHIPS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => send(c.text)}
                  disabled={composerDisabled}
                  className="cursor-pointer rounded-full border border-[rgba(15,34,51,.14)] bg-porcelain-grain px-3 py-[7px] text-[12px] text-navy2 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:border-gold hover:bg-[rgba(201,168,106,.08)] hover:shadow-[0_4px_12px_rgba(201,168,106,.25)] hover:text-navy disabled:cursor-default disabled:opacity-50"
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* composer */}
          <div className="flex items-end gap-[7px] px-3 pb-3 sm:gap-[9px] sm:px-4 sm:pb-4">
            <button
              onClick={toggleListening}
              disabled={composerDisabled}
              aria-label={isListening ? "Parar gravação" : "Gravar áudio"}
              className={`flex h-[48px] w-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[11px] transition-all duration-200 ease-out border ${isListening
                ? "bg-[#ef4444] text-white border-transparent"
                : "bg-transparent border-transparent text-[#667085] hover:-translate-y-px hover:text-gold"
                }`}
              title={isListening ? "Parar gravação" : "Gravar áudio"}
            >
              <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm4-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={composerDisabled}
              placeholder={rateLimited ? "Limite de perguntas atingido. Tente novamente em 24h." : "Escreva sua dúvida jurídica..."}
              className="h-[48px] flex-1 rounded-[11px] border border-[rgba(15,34,51,.12)] bg-porcelain-grain px-[14px] text-[14px] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold disabled:opacity-60"
            />
            <button
              onClick={() => send()}
              disabled={composerDisabled}
              aria-label="Enviar"
              className="flex h-[48px] w-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[11px] bg-navy text-gold transition-all duration-200 ease-out hover:-translate-y-px hover:bg-navy2"
            >
              <svg className="h-[20px] w-[20px] translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// Texto revelado caractere a caractere com fade-in + slide suave.
//
// TODOS os caracteres ficam no fluxo o tempo todo — os ainda não
// revelados apenas invisíveis (opacity 0), MAS ocupando seu espaço. Isso
// mantém a largura/altura da bolha ESTÁVEIS (as do texto final) e deixa o
// WRAP NATIVO do navegador cuidar das quebras (horizontal, correto). Como
// a bolha já tem sua largura final, a 1ª linha está exatamente cheia até
// onde a palavra seguinte não cabe; revelando em ORDEM, nenhum caractere
// da 2ª linha aparece antes de toda a 1ª — a digitação "pula de linha"
// como num caderno.
//
// `text` é o texto COMPLETO; a animação de digitação é controlada aqui.
// ====================================================================
const CHAR_REVEAL_MS = 34; // ritmo por caractere (casa com o typeOut anterior)

function RevealedText({ text, onDone }) {
  const prefersReducedMotion = useReducedMotion();
  const rafRef = useRef(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone; // sempre o callback mais recente, sem re-disparar o effect
  const [revealed, setRevealed] = useState(0);

  const chars = text ? Array.from(text) : [];
  const total = chars.length;

  useEffect(() => {
    doneRef.current = false;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current?.();
    };

    if (prefersReducedMotion || total === 0) {
      setRevealed(total);
      finish();
      return;
    }

    setRevealed(0);
    let startedAt = 0;
    const tick = (now) => {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;
      const count = Math.min(total, Math.ceil(elapsed / CHAR_REVEAL_MS));
      setRevealed(count);
      if (count < total) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, prefersReducedMotion, total]);

  if (!text) return null;

  // Agrupa em palavras (letras + separador colado) para que o wrap nativo
  // quebre ENTRE palavras — nunca no meio. Cada palavra é um inline-block,
  // e o separador fica como texto puro para criar a oportunidade de quebra.
  const parts = [];
  let solid = [];
  let solidStart = 0;
  const flush = (sep) => { parts.push({ start: solidStart, chars: solid, sep }); solid = []; };
  chars.forEach((ch, i) => {
    if (/\s/.test(ch)) { flush(ch); solidStart = i + 1; }
    else { if (solid.length === 0) solidStart = i; solid.push(ch); }
  });
  if (solid.length) flush(null);

  const charSpan = (char, globalIndex) => {
    const shown = globalIndex < revealed;
    return (
      <motion.span
        key={globalIndex}
        initial={false}
        animate={shown
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: "0.35em", filter: "blur(3px)" }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ display: "inline-block", whiteSpace: "pre" }}
      >
        {char}
      </motion.span>
    );
  };

  return (
    <>
      {parts.map((word, wi) => (
        <span key={`w-${wi}-${word.start}`}>
          {word.chars.length > 0 && (
            <span style={{ display: "inline-block", whiteSpace: "pre" }}>
              {word.chars.map((char, k) => charSpan(char, word.start + k))}
            </span>
          )}
          {word.sep != null && word.sep}
        </span>
      ))}
    </>
  );
}

// ====================================================================
// Formulário de captura de lead (inline no chat)
// Itens 1 (captura + validação), 7 (LGPD), 13 (microcopy de segurança)
// ====================================================================
function LeadForm({ lead, setLead, errors, consent, setConsent, busy, onSubmit, diagnostico }) {
  const set = (k) => (e) => setLead((l) => ({ ...l, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="animate-msg-in ml-[39px] rounded-[14px] border border-[rgba(201,168,106,.3)] bg-porcelain-grain p-[16px] shadow-[0_2px_8px_rgba(6,15,23,.06)]"
      aria-label="Formulário de contato"
    >
      <div className="mb-[10px] font-mono text-[9.5px] uppercase tracking-[1.4px] text-golddk">
        Para um advogado dar sequência
      </div>

      {diagnostico && (
        <p className="mb-[12px] rounded-[9px] border-l-2 border-gold bg-[rgba(201,168,106,.1)] px-[11px] py-[8px] text-[12.5px] leading-[1.55] text-[#22323f]">
          {diagnostico}
        </p>
      )}

      <div className="flex flex-col gap-[9px]">
        <div>
          <label htmlFor="lead-nome" className="sr-only">Nome</label>
          <input
            id="lead-nome"
            type="text"
            value={lead.nome}
            onChange={set("nome")}
            placeholder="Seu nome"
            autoComplete="name"
            aria-invalid={Boolean(errors.nome)}
            className="w-full rounded-[9px] border border-[rgba(15,34,51,.14)] bg-card px-[12px] py-[10px] text-[13.5px] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold"
          />
          {errors.nome && <p className="mt-1 text-[11px] text-[#b42318]">{errors.nome}</p>}
        </div>

        <div>
          <label htmlFor="lead-tel" className="sr-only">WhatsApp</label>
          <input
            id="lead-tel"
            type="tel"
            inputMode="tel"
            value={lead.telefone}
            onChange={set("telefone")}
            onBlur={() => setLead((l) => ({ ...l, telefone: formatBRPhone(l.telefone) }))}
            placeholder="WhatsApp — (21) 99999-8888"
            autoComplete="tel"
            aria-invalid={Boolean(errors.telefone)}
            className="w-full rounded-[9px] border border-[rgba(15,34,51,.14)] bg-card px-[12px] py-[10px] text-[13.5px] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold"
          />
          {errors.telefone && <p className="mt-1 text-[11px] text-[#b42318]">{errors.telefone}</p>}
        </div>

        <div>
          <label htmlFor="lead-email" className="sr-only">E-mail (opcional)</label>
          <input
            id="lead-email"
            type="email"
            inputMode="email"
            value={lead.email}
            onChange={set("email")}
            placeholder="E-mail (opcional)"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="w-full rounded-[9px] border border-[rgba(15,34,51,.14)] bg-card px-[12px] py-[10px] text-[13.5px] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold"
          />
          {errors.email && <p className="mt-1 text-[11px] text-[#b42318]">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="lead-info" className="sr-only">Informações extras</label>
          <textarea
            id="lead-info"
            value={lead.infoExtra}
            onChange={set("infoExtra")}
            rows={3}
            placeholder="Informações extras sobre o seu caso (opcional)"
            className="w-full resize-none rounded-[9px] border border-[rgba(15,34,51,.14)] bg-card px-[12px] py-[10px] text-[13.5px] leading-[1.5] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold"
          />
        </div>
      </div>

      {/* consentimento LGPD (item 7) */}
      <label className="mt-[12px] flex cursor-pointer items-start gap-[8px]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={Boolean(errors.consent)}
          className="mt-[2px] h-[15px] w-[15px] shrink-0 cursor-pointer accent-[#9c7b3f]"
        />
        <span className="text-[11.5px] leading-[1.5] text-[#5c6b76]">
          Autorizo o contato da DAP Advocacia sobre o meu caso e o uso dos meus dados para esse
          atendimento, conforme a LGPD.
        </span>
      </label>
      {errors.consent && <p className="mt-1 text-[11px] text-[#b42318]">{errors.consent}</p>}

      {/* microcopy de segurança (item 13) */}
      <p className="mt-[10px] flex items-center gap-[6px] text-[11px] text-[#7a8893]">
        <svg className="h-[13px] w-[13px] shrink-0 text-golddk" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
        Usamos seu contato apenas para um advogado falar com você. Sem spam.
      </p>

      <button
        type="submit"
        disabled={busy}
        className="mt-[14px] w-full cursor-pointer rounded-[10px] bg-navy px-[18px] py-[12px] text-[14px] font-semibold text-gold transition-all duration-200 ease-out hover:-translate-y-px hover:bg-navy2 disabled:cursor-default disabled:opacity-60"
      >
        {busy ? "Enviando…" : "Falar com um advogado"}
      </button>
    </form>
  );
}
