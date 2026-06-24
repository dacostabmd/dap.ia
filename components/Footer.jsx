export default function Footer() {
  return (
    <footer className="bg-darknavy px-7 pb-8 pt-14 text-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-11 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://dapadvocacia.com.br/wp-content/uploads/2026/04/dap-newlogo-large-scaled.png"
            alt="DAP Advocacia"
            className="mb-4 block h-[52px] w-auto"
          />
          <p className="m-0 mb-[18px] max-w-[360px] text-[13.5px] leading-[1.6] text-white/55">
            Escritório full-service no Rio de Janeiro e parte do Grupo Durão, presente em 12 estados, com mais de 17
            anos de experiência em diversas áreas do Direito.
          </p>
          <p className="m-0 max-w-[380px] border-l-2 border-[rgba(201,168,106,.4)] pl-3 text-[12px] leading-[1.6] text-white/40">
            A DAP.IA oferece orientações jurídicas gerais e{" "}
            <strong className="font-semibold text-white/70">não substitui</strong> a consulta individualizada com um
            advogado.
          </p>
        </div>
        <div>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[2px] text-gold">Contato</div>
          <div className="flex flex-col gap-[11px]">
            <a href="http://wa.me/552120187918" className="text-[14px] text-white/70 no-underline hover:text-white">
              WhatsApp · (21) 2018-7918
            </a>
            <a href="tel:+552120187918" className="text-[14px] text-white/70 no-underline hover:text-white">
              Telefone · (21) 2018-7918
            </a>
            <a href="mailto:contato@dapadvocacia.com.br" className="text-[14px] text-white/70 no-underline hover:text-white">
              contato@dapadvocacia.com.br
            </a>
          </div>
        </div>
        <div>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[2px] text-gold">Áreas</div>
          <div className="flex flex-col gap-[11px]">
            {["Consumidor", "Trabalhista", "Família e Sucessões", "Previdenciário"].map((a) => (
              <a key={a} href="#areas" className="text-[14px] text-white/70 no-underline hover:text-white">
                {a}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-9 flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-white/[.08] pt-6">
        <span className="text-[12px] text-white/40">© 2026 DAP Advocacia. Todos os direitos reservados.</span>
        <span className="font-mono text-[11px] tracking-[1px] text-[rgba(201,168,106,.6)]">
          Powered by DAP.IA · RAG
        </span>
      </div>
    </footer>
  );
}
