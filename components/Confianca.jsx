import Image from "next/image";
import Reveal from "@/components/Reveal";
import { DIFERENCIAIS } from "@/lib/data";
import Grainient from "@/components/Grainient";
import drBruno from "@/app/assets/dr_bruno.png";

const STATS = [
  { n: "18+", l: "anos de experiência" },
  { n: "12", l: "estados no país" },
  { n: "800+", l: "colaboradores" },
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
        <div className="relative z-10 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1">
            <span className="font-mono text-[18px] uppercase tracking-[2.6px] text-gold">Inovação na área LegalTech</span>
            <h2 className="m-0 mb-4 mt-[14px] font-serif text-[32px] font-semibold leading-[1.2] text-white">
              18 anos de advocacia. Agora, também nos seus primeiros segundos.
            </h2>
            <p className="m-0 max-w-[640px] text-[22px] leading-[1.65] text-white/70">
              Parte do Grupo Durão — rede jurídica presente em 12 estados. Criamos a   <span className="text-[22px] text-gold">DAP.IA</span>,
              nossa recepcionista digital: ela <span className="text-[22px] text-gold">ouve</span> seu caso, <span className="text-[22px] text-gold">explica</span> seus direitos e já te
              <span className="text-[22px] text-gold"> conecta</span> com o advogado certo — <span className="text-[22px] text-gold">24 horas por dia</span>, com total transparência sobre
              as fontes que usa. Quando o caso pede profundidade, um advogado humano assume
              a partir daí.
            </p>
          </div>

          <div className="shrink-0 lg:w-[300px]">
            <Image
              src={drBruno}
              alt="Ilustração do Dr. Bruno, advogado do Grupo Durão"
              className="w-full max-w-[240px] lg:max-w-full"
            />
          </div>
        </div>

        <div className="relative z-10 mt-[42px] flex flex-wrap items-center gap-x-[28px] gap-y-[14px] border-t border-white/10 pt-[34px]">
          {DIFERENCIAIS.map((d, i) => (
            <div key={d.t} className="flex items-center gap-[10px]">
              {i > 0 && <span className="hidden h-[14px] w-px bg-white/20 sm:block" aria-hidden="true" />}
              <span className="text-[15px] text-gold">✦</span>
              <span className="text-[13.5px] font-semibold text-white">{d.t}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
