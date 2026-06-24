import Reveal from "@/components/Reveal";

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
    <section id="funciona" className="mx-auto max-w-[1200px] px-7 pb-10 pt-24">
      <Reveal className="mx-auto mb-14 max-w-[720px] text-center">
        <span className="font-mono text-[11px] uppercase tracking-[2.6px] text-golddk">Como funciona</span>
        <h2 className="m-0 mb-[14px] mt-[14px] font-serif text-[38px] font-semibold leading-[1.15] tracking-[-.4px] text-navy">
          Tecnologia RAG a serviço do seu caso
        </h2>
        <p className="m-0 text-[17px] leading-[1.6] text-[#5c6b76]">
          Diferente de um chatbot genérico, a DAP.IA consulta a base de documentos do escritório antes de responder — e
          mostra de onde tirou cada informação.
        </p>
      </Reveal>
      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal
            key={s.n}
            delay={i * 120}
            className={`rounded-[16px] border p-[30px_26px] ${
              s.dark ? "border-[rgba(201,168,106,.25)] bg-navy" : "border-[rgba(15,34,51,.08)] bg-white"
            }`}
          >
            <div className="mb-[18px] font-mono text-[13px] tracking-[1px] text-gold">{s.n}</div>
            <h3 className={`m-0 mb-[10px] font-serif text-[21px] font-semibold ${s.dark ? "text-white" : "text-navy"}`}>
              {s.t}
            </h3>
            <p className={`m-0 text-[14.5px] leading-[1.6] ${s.dark ? "text-white/70" : "text-[#5c6b76]"}`}>{s.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
