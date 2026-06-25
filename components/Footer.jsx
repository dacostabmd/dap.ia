import Grainient from "@/components/Grainient";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden" style={{ background: "#060f17" }}>
      <Grainient
        className="absolute inset-0 z-0"
        color1="#122a3d"
        color2="#0a1924"
        color3="#060f17"
        timeSpeed={0.1}
        warpStrength={0.4}
        warpFrequency={2.5}
        warpAmplitude={100.0}
        rotationAmount={200.0}
        grainAmount={0.05}
        grainScale={1.5}
        contrast={1.1}
        saturation={0.5}
        zoom={0.9}
        blendAngle={15.0}
      />
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-7 py-8">
        <span className="text-[12px] text-white/40">© 2026 DAP Advocacia. Todos os direitos reservados.</span>
        <span className="font-mono text-[11px] tracking-[1px] text-[rgba(201,168,106,.5)]">
          Desenvolvido por Caio Marques
        </span>
      </div>
    </footer>
  );
}
