"use client";

// CTA fixo no rodapé — apenas em telas < 768px (item 9).
// "Analisar meu caso" rola suavemente até o chat; atalho de WhatsApp ao lado.
// Escondido no desktop via md:hidden.

const WHATSAPP_URL = "http://wa.me/552120187918";

export default function MobileCTA() {
  const goToChat = (e) => {
    e.preventDefault();
    const el = document.getElementById("chat");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(201,168,106,.25)] bg-navy/95 px-3 py-[10px] backdrop-blur-md md:hidden">
      <div className="flex items-center gap-[9px]">
        <a
          href="#chat"
          onClick={goToChat}
          className="flex-1 cursor-pointer rounded-[10px] bg-gold px-[18px] py-[12px] text-center text-[14px] font-semibold text-navy shadow-[0_6px_18px_rgba(201,168,106,.28)] transition-all duration-200 ease-out active:scale-[.98]"
        >
          Analisar meu caso
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar pelo WhatsApp"
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[rgba(201,168,106,.4)] text-gold transition-all duration-200 ease-out active:scale-[.96]"
        >
          <svg className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.711zm5.831-5.793c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
