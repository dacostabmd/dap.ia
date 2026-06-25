import Reveal from "@/components/Reveal";
import { DIFERENCIAIS } from "@/lib/data";
import Grainient from "@/components/Grainient";

const STATS = [
  { n: "17+", l: "anos de experiência" },
  { n: "12", l: "estados no país" },
  { n: "800+", l: "colaboradores" },
];

const SEALS = [
  { src: "https://dapadvocacia.com.br/wp-content/uploads/2024/11/selo-member-1024x577.png", alt: "Selo de membro" },
  { src: "https://dapadvocacia.com.br/wp-content/uploads/2024/11/law-awards-2026.png", alt: "Law Awards 2026" },
  { src: "https://dapadvocacia.com.br/wp-content/uploads/2024/11/reclame-aqui-selo-1024x356.png", alt: "Reclame Aqui" },
  { src: "https://dapadvocacia.com.br/wp-content/uploads/2024/11/certificadora1000-1024x509.png", alt: "Certificadora" },
];

export default function Confianca() {
  return (
    <section id="confianca" className="mx-auto max-w-[1200px] px-7 pb-14 pt-16">
      <Reveal className="relative overflow-hidden rounded-[22px] bg-navy p-[48px_44px]">
        <Grainient
          color1="#122a3d"
          color2="#0a1924"
          color3="#060f17"
          timeSpeed={0.1}
          warpStrength={0.4}
          warpFrequency={2.5}
          warpAmplitude={110.0}
          rotationAmount={180.0}
          grainAmount={0.04}
          grainScale={1.5}
          contrast={1.1}
          saturation={0.5}
          zoom={0.92}
          blendAngle={10.0}
        />
        <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[2.6px] text-gold">Por que confiar</span>
            <h2 className="m-0 mb-4 mt-[14px] font-serif text-[32px] font-semibold leading-[1.2] text-white">
              Um escritório consolidado, agora com a velocidade da IA.
            </h2>
            <p className="m-0 mb-7 text-[15.5px] leading-[1.65] text-white/70">
              Parte do <strong className="font-semibold text-white">Grupo Durão</strong> — rede jurídica de alta
              performance presente em 12 estados. A DAP.IA é o primeiro atendimento: rápido, disponível 24h e
              transparente sobre suas fontes. Quando o caso exige, um advogado humano assume.
            </p>
            <div className="grid grid-cols-3 gap-5">
              {STATS.map((s) => (
                <div key={s.l}>
                  <div className="font-serif text-[34px] font-bold leading-none text-gold">{s.n}</div>
                  <div className="mt-[6px] text-[12px] text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            {SEALS.map((s) => (
              <div
                key={s.alt}
                className="flex aspect-[1.4] cursor-pointer items-center justify-center rounded-[12px] border border-[rgba(201,168,106,.22)] bg-white p-[18px] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-[4px] hover:border-gold hover:shadow-[0_12px_28px_rgba(201,168,106,.18)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-[42px] grid grid-cols-2 gap-6 border-t border-white/10 pt-[34px] md:grid-cols-4">
          {DIFERENCIAIS.map((d) => (
            <div key={d.t}>
              <div className="mb-[6px] font-serif text-[16px] font-semibold text-white">{d.t}</div>
              <div className="text-[12.5px] leading-[1.55] text-white/60">{d.d}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
