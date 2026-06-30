import Reveal from "@/components/Reveal";
import { AREAS } from "@/lib/data";

export default function Areas() {
  return (
    <section id="areas" className="mx-auto max-w-[1200px] px-7 pb-10 pt-[90px]">
      <Reveal className="mb-[38px]">
        <span className="font-mono text-[11px] uppercase tracking-[2.6px] text-golddk">Áreas de atuação</span>
        <h2 className="m-0 mt-[14px] font-serif text-[38px] font-semibold leading-[1.15] tracking-[-.4px] text-navy">
          A DAP.IA entende de todas as áreas do escritório
        </h2>
      </Reveal>
      <Reveal className="grid grid-cols-2 gap-[18px] md:grid-cols-4">
        {AREAS.map((a) => (
          <div
            key={a.t}
            className="group relative cursor-pointer overflow-hidden rounded-[14px] border border-[rgba(15,34,51,.08)] bg-porcelain-grain p-6 transition-all duration-500 ease-in-out hover:-translate-y-[9px] hover:border-gold hover:bg-[linear-gradient(165deg,#ece8de_58%,#f0ddb8)] hover:shadow-[0_26px_48px_rgba(6,15,23,.16)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] bg-navy font-serif text-[19px] font-bold text-gold transition-all duration-500 ease-in-out group-hover:-translate-y-[3px] group-hover:scale-[1.08] group-hover:bg-gold group-hover:text-navy">
              {a.k}
            </div>
            <h3 className="m-0 mb-[7px] font-serif text-[17px] font-semibold text-navy">{a.t}</h3>
            <p className="m-0 text-[13px] leading-[1.55] text-[#5c6b76]">{a.d}</p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
