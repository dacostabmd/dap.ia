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
          <svg className="h-[24px] w-[24px]" fill="currentColor" viewBox="0 0 448 512">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
