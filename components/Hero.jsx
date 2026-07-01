import Image from "next/image";
import Chat from "@/components/Chat";
import Grainient from "@/components/Grainient";
import selos from "@/app/assets/selos.png";

export default function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#060f17" }}>
      <Grainient
        color1="#122a3d"
        color2="#0a1924"
        color3="#060f17"
        timeSpeed={0.15}
        warpStrength={0.6}
        warpFrequency={3.0}
        warpAmplitude={80.0}
        rotationAmount={300.0}
        grainAmount={0.04}
        grainScale={1.5}
        contrast={1.2}
        saturation={0.7}
        zoom={0.85}
        blendAngle={35.0}
      />
      {/* brand strip (sem navbar) */}
      <div className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-center px-7 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://dapadvocacia.com.br/wp-content/uploads/2026/04/dap-newlogo-large-scaled.png"
          alt="DAP Advocacia"
          className="block h-[58px] w-auto"
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center px-7 pb-[84px] pt-[54px] text-center">
        {/* badge — sempre centralizado */}
        <div className="mb-[26px] inline-flex items-center gap-[9px] rounded-full border border-[rgba(201,168,106,.4)] px-[15px] py-[7px]">
          <span className="h-[6px] w-[6px] rounded-full bg-[#5fc28a] shadow-[0_0_0_3px_rgba(95,194,138,.18)]" />
          <span className="font-mono text-[11px] uppercase tracking-[1.6px] text-gold">
            18+ anos · OAB/RJ · Full Service
          </span>
        </div>

        {/* título + selos: lado a lado no desktop, empilhado no mobile */}
        <div className="mb-[32px] flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-14 lg:text-left">
          <div className="flex-1">
            <h1 className="m-0 mb-[20px] font-serif text-[48px] font-semibold leading-[1.08] tracking-[-.5px] text-white lg:text-[52px]">
              Descubra em segundos se você tem direito a <span className="italic text-gold">reaver</span> seu bem ou
              revisar sua dívida.
            </h1>
            <p className="m-0 text-[18px] leading-[1.6] text-white/[.74]">
              A <strong className="font-semibold text-white">DAP.IA</strong> entende seu caso e explica seus direitos com
              base na legislação e na nossa biblioteca jurídica — respostas claras, em segundos, sempre com as{" "}
              <strong className="font-semibold text-white">fontes citadas</strong>.
            </p>
          </div>
          <div className="shrink-0 lg:w-[380px]">
            <Image
              src={selos}
              alt="Selos de qualificação"
              className="w-full max-w-[360px] opacity-80 lg:max-w-full"
            />
          </div>
        </div>


        <Chat />

        <div className="mt-[28px] flex flex-wrap justify-center gap-[18px]">
          {["Respostas com fonte", "Conversa criptografada", "Encaminhamento a um advogado"].map((f) => (
            <div key={f} className="flex items-center gap-[9px]">
              <span className="text-[15px] text-gold">✦</span>
              <span className="text-[13px] text-white/60">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
