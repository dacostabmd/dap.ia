import Reveal from "@/components/Reveal";

export default function CTA() {
  return (
    <section className="mx-auto max-w-[1200px] px-7 pb-[90px] pt-5">
      <Reveal className="rounded-[22px] border border-[rgba(201,168,106,.3)] bg-porcelain-grain p-[56px_32px] text-center">
        <h2 className="m-0 mb-[14px] font-serif text-[36px] font-semibold leading-[1.15] tracking-[-.4px] text-navy">
          Entenda seu caso em segundos
        </h2>
        <p className="mx-auto mb-[30px] max-w-[520px] text-[17px] leading-[1.6] text-[#5c6b76]">
          Descreva sua situação para a DAP.IA e veja, com fontes, quais direitos podem ser seus. Se preferir, falamos
          com você pelo WhatsApp.
        </p>
        <div className="flex flex-wrap justify-center gap-[14px]">
          <a
            href="#chat"
            className="cursor-pointer rounded-[9px] bg-navy px-[30px] py-[15px] text-[15px] font-semibold text-white transition-[transform,background] duration-200 ease-out hover:-translate-y-[3px] hover:scale-[1.02] hover:bg-navy2"
          >
            Analisar meu caso grátis
          </a>
          <a
            href="http://wa.me/552120187918"
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer rounded-[9px] border border-[rgba(15,34,51,.16)] bg-porcelain-grain px-[26px] py-[15px] text-[15px] font-semibold text-navy transition-[transform,border-color] duration-200 ease-out hover:-translate-y-[3px] hover:border-gold"
          >
            WhatsApp · (21) 2018-7918
          </a>
        </div>
      </Reveal>
    </section>
  );
}
