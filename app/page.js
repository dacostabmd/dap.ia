import Hero from "@/components/Hero";
import DireitosCarousel from "@/components/DireitosCarousel";
import Areas from "@/components/Areas";
import Confianca from "@/components/Confianca";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <DireitosCarousel />
      <Areas />
      <Confianca />
      <Footer />
    </main>
  );
}
