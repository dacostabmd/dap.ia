import Hero from "@/components/Hero";
import ComoFunciona from "@/components/ComoFunciona";
import DireitosCarousel from "@/components/DireitosCarousel";
import Areas from "@/components/Areas";
import Confianca from "@/components/Confianca";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <ComoFunciona />
      <DireitosCarousel />
      <Areas />
      <Confianca />
      <CTA />
      <Footer />
    </main>
  );
}
