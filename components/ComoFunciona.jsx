import Reveal from "@/components/Reveal";
import Grainient from "@/components/Grainient";

const STEPS = [
  {
    n: "01",
    t: "Você pergunta",
    d: "Escreva sua dúvida em linguagem natural, como falaria com um advogado. Sem formulários, sem juridiquês obrigatório.",
    dark: false,
  },
  {
    n: "02",
    t: "A IA busca nas fontes",
    d: "O motor RAG recupera os trechos mais relevantes da legislação e dos guias jurídicos da DAP, garantindo respostas ancoradas em referências reais.",
    dark: true,
  },
  {
    n: "03",
    t: "Resposta com fonte",
    d: "Você recebe uma orientação clara, com as fontes citadas e a opção de encaminhar o caso a um advogado da área correspondente.",
    dark: false,
  },
];

export default function ComoFunciona() {
  return (
    <section id="funciona" className="relative overflow-hidden" style={{ background: "#060f17" }}>
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
      <div className="relative z-10 mx-auto max-w-[1200px] px-7 pb-10 pt-24">
        <Reveal className="mx-auto mb-14 max-w-[720px] text-center">
          <span className="font-mono text-[11px] uppercase tracking-[2.6px] text-gold">Como funciona</span>
          <h2 className="m-0 mb-[14px] mt-[14px] font-serif text-[38px] font-semibold leading-[1.15] tracking-[-.4px] text-white">
            Tecnologia RAG a serviço do seu caso
          </h2>
          <p className="m-0 text-[17px] leading-[1.6] text-white/60">
            Diferente de um chatbot genérico, a DAP.IA consulta a base de documentos do escritório antes de responder — e
            mostra de onde tirou cada informação.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 120}
              className={`cursor-pointer rounded-[16px] border p-[30px_26px] transition-all duration-500 ease-in-out hover:-translate-y-[6px] ${
                s.dark
                  ? "border-[rgba(201,168,106,.25)] bg-[rgba(255,255,255,.06)] hover:border-gold hover:bg-[rgba(255,255,255,.08)] hover:shadow-[0_18px_40px_rgba(6,15,23,.4)]"
                  : "border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.04)] hover:border-[rgba(201,168,106,.5)] hover:bg-[rgba(255,255,255,.08)] hover:shadow-[0_18px_40px_rgba(6,15,23,.3)]"
              }`}
            >
              <div className="mb-[18px] font-mono text-[13px] tracking-[1px] text-gold">{s.n}</div>
              <h3 className="m-0 mb-[10px] font-serif text-[21px] font-semibold text-white">{s.t}</h3>
              <p className="m-0 text-[14.5px] leading-[1.6] text-white/60">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
