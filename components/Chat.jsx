"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

export default function Chat() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const listRef = useRef(null);
  const timers = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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
  }, [messages]);

  // perguntas enviadas pelos botões do carrossel "Perguntar à DAP.IA"
  useEffect(() => {
    const handler = (e) => send(e.detail);
    window.addEventListener("dap:ask", handler);
    return () => window.removeEventListener("dap:ask", handler);
  });

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

  const send = useCallback(
    (raw) => {
      const text = (raw ?? input).trim();
      if (!text || sending) return;
      const base = Date.now();
      setMessages((ms) => [...ms, { id: base, role: "user", shownText: text, done: true }]);
      setInput("");
      setSending(true);

      const thinkId = base + 1;
      timers.current.push(
        setTimeout(async () => {
          setMessages((ms) => [
            ...ms,
            { id: thinkId, role: "bot", isThinking: true, shownText: "", sources: [], showSources: false },
          ]);
          let reply = "";
          let sources = [];
          try {
            const res = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: text }),
            });
            const data = await res.json();
            reply = data.reply || "";
            sources = data.sources || [];
          } catch {
            reply = "Desculpe, não consegui responder agora. Tente novamente em instantes.";
          }
          setMessages((ms) => ms.map((m) => (m.id === thinkId ? { ...m, isThinking: false, typing: true } : m)));
          typeOut(thinkId, reply, sources);
        }, 900)
      );
    },
    [input, sending, typeOut]
  );

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
            Desenvolvido por Caio Marques e Equipe de TI
          </span>
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
                  {m.shownText}
                </div>
              </div>
            )
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
            disabled={sending}
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
            disabled={sending}
            rows={1}
            placeholder="Escreva sua dúvida jurídica..."
            className="max-h-24 min-h-[48px] flex-1 resize-none rounded-[11px] border border-[rgba(15,34,51,.12)] bg-porcelain-grain px-[14px] py-[13px] text-[14px] leading-[1.4] text-ink outline-none transition-colors duration-200 ease-out focus:border-gold"
          />
          <button
            onClick={() => send()}
            disabled={sending}
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
