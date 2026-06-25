import Chat from "@/components/Chat";
import Grainient from "@/components/Grainient";

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
      <div className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-7 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://dapadvocacia.com.br/wp-content/uploads/2026/04/dap-newlogo-large-scaled.png"
          alt="DAP Advocacia"
          className="block h-[58px] w-auto"
        />
        <a
          href="http://wa.me/552120187918"
          target="_blank"
          rel="noreferrer"
          className="inline-flex cursor-pointer items-center gap-[9px] rounded-full border border-[rgba(201,168,106,.4)] px-[17px] py-[9px] transition-[transform,border-color,background] duration-200 ease-out hover:-translate-y-px hover:border-gold hover:bg-[rgba(201,168,106,.12)]"
        >
          <span className="h-[7px] w-[7px] rounded-full bg-[#5fc28a] shadow-[0_0_0_3px_rgba(95,194,138,.18)]" />
          <span className="font-mono text-[12px] tracking-[.6px] text-gold">(21) 2018-7918</span>
        </a>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 px-7 pb-[84px] pt-[54px] lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-[26px] inline-flex items-center gap-[9px] rounded-full border border-[rgba(201,168,106,.4)] px-[15px] py-[7px]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#5fc28a] shadow-[0_0_0_3px_rgba(95,194,138,.18)]" />
            <span className="font-mono text-[11px] uppercase tracking-[1.6px] text-gold">
              17+ anos · OAB/RJ · Full Service
            </span>
          </div>
          <h1 className="m-0 mb-[22px] font-serif text-[52px] font-semibold leading-[1.08] tracking-[-.5px] text-white">
            Orientação jurídica inteligente, <span className="italic text-gold">fundamentada</span> nos documentos do
            escritório.
          </h1>
          <p className="m-0 mb-[34px] max-w-[520px] text-[18px] leading-[1.6] text-white/[.74]">
            A <strong className="font-semibold text-white">DAP.IA</strong> responde suas dúvidas com base na legislação e
            na nossa biblioteca jurídica — respostas claras, em segundos, sempre com as{" "}
            <strong className="font-semibold text-white">fontes citadas</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-[14px]">
            <a
              href="#chat"
              className="cursor-pointer rounded-[9px] bg-gold px-7 py-[15px] text-[15px] font-semibold tracking-[.2px] text-navy shadow-[0_10px_30px_rgba(201,168,106,.22)] transition-all duration-300 ease-in-out hover:-translate-y-[3px] hover:scale-[1.03] hover:bg-gold2 hover:shadow-[0_18px_40px_rgba(201,168,106,.36)]"
            >
              Conversar agora
            </a>
            <a
              href="#direitos"
              className="cursor-pointer rounded-[9px] border border-white/20 px-[22px] py-[15px] text-[15px] font-medium text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-[rgba(201,168,106,.6)] hover:bg-white/[.04]"
            >
              Conheça seus direitos
            </a>
          </div>
          <div className="mt-[38px] flex flex-wrap gap-[26px]">
            {["Respostas com fonte", "Conversa criptografada", "Encaminhamento a um advogado"].map((f) => (
              <div key={f} className="flex items-center gap-[9px]">
                <span className="text-[15px] text-gold">✦</span>
                <span className="text-[13px] text-white/60">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <Chat />
      </div>
    </section>
  );
}
