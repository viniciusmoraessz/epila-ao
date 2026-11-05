import "./globals.css";
import localFont from "next/font/local";
const serif = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--display-font",
  adjustFontFallback: "Times New Roman",
});
const sans = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
      weight: "600",
    },
  ],
  variable: "--body-font",
});
import Header from "../components/Header";
import { Instagram, MessageCircle } from "lucide-react";
import { contact, phone } from "../lib/catalog";
const title = "Epilação by Anny | Epilação na cera em Buíque — PE",
  description =
    "Conheça o estúdio de Hianny Camilla, escolha sua epilação com cera e agende seu horário em Buíque.";
export const metadata = {
  title,
  description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
        : "http://localhost:3000"),
  ),
  openGraph: {
    title,
    description,
    locale: "pt_BR",
    type: "website",
    images: ["/media/cera.webp"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={[serif.variable, sans.variable].join(" ")}>
      <body>
        <a href="#conteudo" className="skip">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <a
          href={contact}
          className="floating"
          aria-label={
            phone ? "Conversar pelo WhatsApp" : "Conversar pelo Instagram"
          }
        >
          {phone ? <MessageCircle /> : <Instagram />}
        </a>
        <footer className="shell">
          <span>Epilação by Anny · Buíque, PE</span>
          <a href="/admin">Área da Anny</a>
        </footer>
      </body>
    </html>
  );
}
