import { Spectral, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  title: "DAP.IA — Assistente Jurídica | DAP Advocacia",
  description:
    "Orientação jurídica inteligente, fundamentada nos documentos do escritório. A DAP.IA responde suas dúvidas com fontes citadas, em segundos.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${spectral.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="font-sans bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
