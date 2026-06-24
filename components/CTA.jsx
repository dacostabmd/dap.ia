import Reveal from "@/components/Reveal";

export default function CTA() {
  return (
    <section className="mx-auto max-w-[1200px] px-7 pb-[90px] pt-5">
      <Reveal className="rounded-[22px] border border-[rgba(201,168,106,.3)] bg-[linear-gradient(180deg,#fbfaf7,#f1eee6)] p-[56px_32px] text-center">
        <h2 className="m-0 mb-[14px] font-serif text-[36px] font-semibold leading-[1.15] tracking-[-.4px] text-navy">
          Tire sua dúvida jurídica agora
        </h2>
        <p className="mx-auto mb-[30px] max-w-[520px] text-[17px] leading-[1.6] text-[#5c6b76]">
          Comece uma conversa com a DAP.IA. Se preferir, falamos com você pelo WhatsApp.
        </p>
        <div className="flex flex-wrap justify-center gap-[14px]">
          <a
            href="#chat"
            className="rounded-[9px] bg-navy px-[30px] py-[15px] text-[15px] font-semibold text-white transition-[transform,background] duration-200 hover:-translate-y-[3px] hover:scale-[1.02] hover:bg-navy2"
          >
            Conversar com a DAP.IA
          </a>
          <a
            href="http://wa.me/552120187918"
            target="_blank"
            rel="noreferrer"
            className="rounded-[9px] border border-[rgba(15,34,51,.16)] bg-white px-[26px] py-[15px] text-[15px] font-semibold text-navy transition hover:-translate-y-[3px] hover:border-gold"
          >
            WhatsApp · (21) 2018-7918
          </a>
        </div>
      </Reveal>
    </section>
  );
}
