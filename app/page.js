import Hero from "@/components/Hero";
import DireitosCarousel from "@/components/DireitosCarousel";
import Areas from "@/components/Areas";
import Confianca from "@/components/Confianca";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";

export default function Home() {
  return (
    <>
      {/* padding-bottom no mobile p/ não ser coberto pela barra fixa (item 9) */}
      <main className="overflow-x-hidden pb-[72px] md:pb-0">
        <Hero />
        <DireitosCarousel />
        <Areas />
        <Confianca />
        <CTA />
        <Footer />
      </main>
      <MobileCTA />
    </>
  );
}
