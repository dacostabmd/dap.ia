"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Grainient from "@/components/Grainient";
import { SLIDES } from "@/lib/data";

const DURATION = 6500;
const STEP = 100;

export default function DireitosCarousel() {
  const [slide, setSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (paused.current) return;
      setProgress((p) => {
        const np = p + 100 / (DURATION / STEP);
        if (np >= 100) {
          setSlide((s) => (s + 1) % SLIDES.length);
          return 0;
        }
        return np;
      });
    }, STEP);
    return () => clearInterval(id);
  }, []);

  const go = useCallback((i) => {
    const n = SLIDES.length;
    setSlide(((i % n) + n) % n);
    setProgress(0);
  }, []);

  const ask = useCallback((q) => {
    const el = document.getElementById("chat");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    // dispara a pergunta no chat
    setTimeout(() => window.dispatchEvent(new CustomEvent("dap:ask", { detail: q })), 650);
  }, []);

  return (
    <section
      id="direitos"
    >
      <div className="mx-auto max-w-[1200px] px-7 pb-[90px] pt-[86px]">
        {/* header + arrows */}
        <div className="mb-[34px] flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-[640px]">
            <span className="font-mono text-[11px] uppercase tracking-[2.6px] text-gold">Conheça seus direitos</span>
            <h2 className="m-0 mt-[14px] font-serif text-[40px] font-semibold leading-[1.12] tracking-[-.5px]  text-navy">
              Você pode estar pagando por algo que a lei não permite
            </h2>
            <p className="m-0 mt-[14px] text-[16px] leading-[1.6] text-[#5c6b76]">
              Da <strong className="font-semibold text-navy">busca e apreensão</strong> do seu veículo aos{" "}
              <strong className="font-semibold text-navy">juros abusivos</strong> do banco — entenda o que a lei garante
              e pergunte à DAP.IA.
            </p>
          </div>
          <div className="flex w-full justify-center gap-6 sm:w-auto sm:justify-end sm:gap-[10px]">
            <button
              onClick={() => go(slide - 1)}
              aria-label="Anterior"
              className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border border-[rgba(201,168,106,.4)] text-[20px] text-gold transition-all duration-300 ease-out hover:-translate-x-[3px] hover:border-gold hover:bg-[rgba(201,168,106,.14)]"
            >
              <span className="pb-[2px]">←</span>
            </button>
            <button
              onClick={() => go(slide + 1)}
              aria-label="Próximo"
              className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full border border-[rgba(201,168,106,.4)] bg-gold text-[20px] text-navy transition-all duration-300 ease-out hover:translate-x-[3px] hover:bg-gold2"
            >
              <span className="pb-[2px]">→</span>
            </button>
          </div>
        </div>

        {/* viewport */}
        <div
          onMouseEnter={() => (paused.current = true)}
          onMouseLeave={() => (paused.current = false)}
          className="relative overflow-hidden rounded-[22px] border border-[rgba(15,34,51,.1)] bg-navy"
        >
          <Grainient
            color1="#122a3d"
            color2="#0a1924"
            color3="#060f17"
            timeSpeed={0.12}
            warpStrength={0.5}
            warpFrequency={2.8}
            warpAmplitude={90.0}
            rotationAmount={250.0}
            grainAmount={0.045}
            grainScale={1.5}
            contrast={1.15}
            saturation={0.6}
            zoom={0.88}
            blendAngle={20.0}
          />
          <div
            className="relative z-10 flex transition-transform duration-[650ms] ease-[cubic-bezier(.65,0,.18,1)]"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {SLIDES.map((s, i) => {
              const active = i === slide;
              return (
                <div
                  key={s.title}
                  className="min-w-0 shrink-0 grow-0 basis-full p-[50px_52px]"
                >
                  <div
                    className="grid grid-cols-1 items-center gap-[46px] lg:grid-cols-[1.15fr_.85fr]"
                    style={{
                      opacity: active ? 1 : 0.25,
                      transform: active ? "none" : "translateY(20px)",
                      transition: "opacity .55s ease, transform .6s cubic-bezier(.22,.61,.36,1)",
                    }}
                  >
                    <div>
                      <div className="mb-[18px] flex items-center gap-3">
                        {s.featured && (
                          <span className="rounded-[5px] bg-gold px-[9px] py-[5px] font-mono text-[9.5px] font-semibold uppercase tracking-[1.6px] text-navy">
                            Destaque
                          </span>
                        )}
                        <span className="font-mono text-[11px] uppercase tracking-[2px] text-gold">{s.cat}</span>
                      </div>
                      <h3 className="m-0 mb-[14px] font-serif text-[34px] font-semibold leading-[1.12] text-white">
                        {s.title}
                      </h3>
                      <p className="m-0 mb-[22px] max-w-[520px] text-[16px] leading-[1.62] text-white/[.72]">{s.desc}</p>
                      <div className="mb-7 flex flex-col gap-[11px]">
                        {s.points.map((p) => (
                          <div key={p} className="flex items-start gap-[11px]">
                            <span className="mt-px flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-[rgba(201,168,106,.45)] bg-[rgba(201,168,106,.16)] text-[11px] text-gold">
                              ✓
                            </span>
                            <span className="text-[14.5px] leading-[1.5] text-white/[.82]">{p}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => ask(s.ask)}
                        className="inline-flex cursor-pointer items-center gap-[9px] rounded-[9px] border border-gold px-[22px] py-[13px] text-[14px] font-semibold text-gold transition-[transform,background,color] duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-gold hover:text-navy"
                      >
                        Perguntar à DAP.IA <span className="text-[16px]">→</span>
                      </button>
                    </div>

                    {/* reference card */}
                    <div className="flex justify-center">
                      <div
                        className="relative aspect-[.82] w-full max-w-[300px] animate-float overflow-hidden rounded-[18px] border border-[rgba(201,168,106,.28)] shadow-[0_26px_60px_rgba(6,15,23,.5)]"
                        style={{ background: "linear-gradient(160deg,#0a1924,#060f17)" }}
                      >
                        <div className="absolute left-0 right-0 top-0 h-[3px] bg-[linear-gradient(90deg,transparent,#c9a86a,transparent)]" />
                        <div className="relative flex h-full flex-col justify-between p-[26px_24px]">
                          <div className="font-mono text-[9.5px] uppercase tracking-[2px] text-[rgba(201,168,106,.85)]">
                            Base legal
                          </div>
                          <div className="text-center">
                            <div className="font-serif text-[74px] font-bold leading-[.9] text-gold">{s.emblem}</div>
                            <div className="mt-2 font-mono text-[10px] uppercase tracking-[1.5px] text-white/50">
                              {s.refCap}
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-center gap-[6px]">
                            {s.refs.map((r) => (
                              <span
                                key={r}
                                className="rounded-md border border-[rgba(201,168,106,.32)] px-2 py-1 font-mono text-[10px] text-gold"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* progress + dots */}
        <div className="mt-[26px] flex items-center gap-5">
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-navy/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#9c7b3f,#c9a86a)] transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-[9px] cursor-pointer rounded-full p-0 transition-[width,background] duration-300 ease-out"
                style={{ width: i === slide ? 30 : 9, background: i === slide ? "#c9a86a" : "rgba(6,15,23,.18)" }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
