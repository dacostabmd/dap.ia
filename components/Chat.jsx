"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildFallbackMeta } from "@/lib/lead-heuristics";
import { isValidBRPhone, isValidEmail, isValidName, formatBRPhone } from "@/lib/validation";

const CHIPS = [
  { label: "Veículo apreendido", text: "Tive meu veículo apreendido por atraso no financiamento" },
  { label: "Juros abusivos", text: "Meus juros estão abusivos?" },
  { label: "Demissão sem justa causa", text: "Fui demitido sem justa causa, quais meus direitos?" },
];

const GREETING = {
  id: 1,
  role: "bot",
  done: true,
  showSources: false,
  shownText:
    "Sou a DAP.IA, assistente virtual do escritório DAP Advocacia. Em que posso ajudar hoje?",
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
const SLOTS = [
  { id: "hoje-14", label: "Hoje, 14h", dayOffset: 0, hour: 14 },
  { id: "hoje-16", label: "Hoje, 16h", dayOffset: 0, hour: 16 },
  { id: "amanha-10", label: "Amanhã, 10h", dayOffset: 1, hour: 10 },
];

export default function Chat() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ---- recepcionista digital ----
  const [meta, setMeta] = useState({ stage: "entendendo", tipoCaso: "", urgencia: "baixa", readyForForm: false, diagnosticoParcial: "" });
  const [phase, setPhase] = useState("chatting"); // chatting | form | scheduling | done
  const [consent, setConsent] = useState(false);
  const [lead, setLead] = useState({ nome: "", telefone: "", email: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formBusy, setFormBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const listRef = useRef(null);
  const timers = useRef([]);
  const recognitionRef = useRef(null);
  const voiceUsedRef = useRef(false); // o caso foi descrito por voz?
  const dealIdRef = useRef(null); // espelho síncrono p/ updates
  const sessionId = useRef(`session-web-${Math.round(performance.now())}-${messages.length}`);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
      try { recognitionRef.current?.abort(); } catch {}
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
  // Texto digitado letra a letra (INALTERADO)
  // ----------------------------------------------------------------
  const typeOut = useCallback((id, full, sources) => {
    let shown = "";
    const speed = 2;
    const tick = () => {
      shown = full.slice(0, Math.min(full.length, shown.length + speed));
      const typing = shown.length < full.length;
      setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, shownText: shown, typing } : m)));
      if (typing) {
        timers.current.push(setTimeout(tick, 16));
      } else {
        setSending(false);
        timers.current.push(
          setTimeout(
            () => setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, showSources: true, sources } : m))),
            220
          )
        );
      }
    };
    tick();
  }, []);

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
    } catch {}

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
      if (!text || sending) return;
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
          } catch {
            reply = "Desculpe, não consegui responder agora. Tente novamente em instantes.";
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

          // abre o formulário de captura quando indicado e ainda não capturado
          if (nextMeta.readyForForm && !hasContact && phase === "chatting") {
            timers.current.push(setTimeout(() => setPhase("form"), 600));
          }

          setMessages((ms) => ms.map((m) => (m.id === thinkId ? { ...m, isThinking: false, typing: true } : m)));
          typeOut(thinkId, reply, sources);
        }, 900)
      );
    },
    [input, sending, typeOut, buildHistory, progressiveUpdate, phase]
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

      // calcula início/fim em ISO a partir do offset (sem libs)
      const start = new Date();
      start.setDate(start.getDate() + slot.dayOffset);
      start.setHours(slot.hour, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

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
            startIso: start.toISOString(),
            endIso: end.toISOString(),
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
  const composerDisabled = sending;

  return (
    <div id="chat" className="relative w-full max-w-2xl">
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
            <div className="text-[11.5px] text-white/55">Online · responde em segundos</div>
          </div>
          <span className="rounded-md border border-[rgba(201,168,106,.35)] px-2 py-1 font-mono text-[9.5px] tracking-[1.2px] text-gold">
            Supervisionado por advogados · OAB/RJ
          </span>
        </div>

        {/* indicador de progresso (item 6) */}
        <div className="flex items-center gap-2 border-b border-[rgba(201,168,106,.15)] bg-navy px-[18px] py-[10px]">
          {STEPS.map((s, i) => {
            const reached = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-[7px]">
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-all duration-200 ease-out ${
                      reached
                        ? "border-gold bg-gold text-navy"
                        : "border-white/25 bg-transparent text-white/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`whitespace-nowrap text-[10px] tracking-[.3px] transition-colors duration-200 ease-out ${
                      active ? "font-semibold text-gold" : reached ? "text-white/70" : "text-white/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`h-px flex-1 transition-colors duration-200 ease-out ${i < currentStep ? "bg-gold/60" : "bg-white/15"}`} />
                )}
              </div>
            );
          })}
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
                  <div className="max-w-[65%] rounded-[4px_14px_14px_14px] border border-[rgba(15,34,51,.08)] bg-porcelain-grain px-[14px] py-3 shadow-[0_2px_8px_rgba(6,15,23,.06)]">
                    {m.isThinking ? (
                      <div className="flex items-center gap-[5px] py-0.5">
                        {[0, 0.18, 0.36].map((d, i) => (
                          <span
                            key={i}
                            className="h-[7px] w-[7px] rounded-full bg-golddk"
                            style={{ animation: `dotPulse 1.2s ease-in-out ${d}s infinite` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="text-[14px] leading-[1.62] text-[#22323f]">
                          {m.shownText}
                          {m.typing && (
                            <span className="ml-0.5 inline-block h-[14px] w-0.5 -translate-y-px bg-gold align-middle animate-blink" />
                          )}
                        </div>
                        {m.typing && !m.shownText && (
                          <div className="flex items-center gap-[4px] py-0.5">
                            <span className="h-[6px] w-[6px] rounded-full bg-golddk" style={{ animation: 'dotPulse 1.2s ease-in-out 0s infinite' }} />
                            <span className="h-[6px] w-[6px] rounded-full bg-golddk" style={{ animation: 'dotPulse 1.2s ease-in-out 0.2s infinite' }} />
                            <span className="h-[6px] w-[6px] rounded-full bg-golddk" style={{ animation: 'dotPulse 1.2s ease-in-out 0.4s infinite' }} />
                          </div>
                        )}
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
                <div className="max-w-[78%] rounded-[14px_4px_14px_14px] bg-navy2 px-[14px] py-[11px] text-[14px] leading-[1.55] text-white shadow-[0_3px_10px_rgba(6,15,23,.28)]">
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
                {SLOTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSlot(s)}
                    disabled={scheduleBusy}
                    className="rounded-full border border-[rgba(15,34,51,.16)] bg-card px-[14px] py-[8px] text-[12.5px] font-medium text-navy2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-gold hover:bg-[rgba(201,168,106,.15)] disabled:opacity-50"
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

        {/* chips */}
        <div className="flex flex-wrap gap-[7px] px-[18px] pb-3 pt-[6px]">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => send(c.text)}
              className="rounded-full border border-[rgba(15,34,51,.14)] bg-porcelain-grain px-3 py-[7px] text-[12px] text-navy2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-gold hover:bg-[rgba(201,168,106,.15)]"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* composer */}
        <div className="flex items-end gap-[9px] px-4 pb-4">
          <button
            onClick={toggleListening}
            disabled={composerDisabled}
            aria-label={isListening ? "Parar gravação" : "Gravar áudio"}
            className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[11px] transition-all duration-200 ease-out ${
              isListening
                ? "bg-[#ef4444] text-white"
                : "bg-porcelain-grain text-[#667085] hover:-translate-y-px hover:bg-gold/20"
            }`}
            title={isListening ? "Parar gravação" : "Gravar áudio"}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm4-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={composerDisabled}
            rows={1}
            placeholder="Escreva sua dúvida jurídica..."
            className="max-h-24 min-h-[48px] flex-1 resize-none rounded-[11px] border border-[rgba(15,34,51,.12)] bg-porcelain-grain px-[14px] py-[13px] text-[14px] leading-[1.4] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold"
          />
          <button
            onClick={() => send()}
            disabled={composerDisabled}
            aria-label="Enviar"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[11px] bg-navy text-[20px] text-gold transition-all duration-200 ease-out hover:-translate-y-px hover:bg-navy2"
          >
            <span className="pb-[2px]">→</span>
          </button>
        </div>
        </div>
      </div>
    </div>
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
