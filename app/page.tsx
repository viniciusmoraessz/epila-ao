import { studio } from "../lib/studio";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  Instagram,
  MapPin,
  Heart,
  ShieldCheck,
  Leaf,
  MessageCircle,
  Flower2,
  Camera,
} from "lucide-react";
import { Butterfly } from "../components/Brand";
import Catalog from "../components/Catalog";
import { contact, instagram, phone } from "../lib/catalog";
const faq = [
  [
    "A epilação com cera dói?",
    "A sensibilidade varia de pessoa para pessoa e de acordo com a região. Conte à Anny como está se sentindo durante o atendimento.",
  ],
  [
    "Qual o tamanho ideal do pelo?",
    "Cerca de 6 mm já permite que a cera agarre o pelo. Se estiver em dúvida, converse com a Anny antes da sessão.",
  ],
  [
    "Gestantes podem agendar?",
    "Informe a gestação antes de reservar e converse com sua equipe de pré-natal sobre seu caso.",
  ],
  [
    "E se minha pele for sensível?",
    "Conte sobre reações anteriores. Áreas muito sensíveis, irritadas ou queimadas de sol precisam se recuperar antes da epilação.",
  ],
  [
    "Existem contraindicações?",
    "Informe o uso de retinoides e medicamentos dermatológicos. Quem usa ou usou isotretinoína nos últimos seis meses deve evitar a epilação com cera.",
  ],
  [
    "Como remarcar ou cancelar?",
    "Use o link privado recebido ao reservar para consultar ou cancelar dentro do prazo. Para remarcar, fale diretamente com a Anny.",
  ],
];
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: "Epilação by Anny",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Buíque",
              addressRegion: "PE",
              addressCountry: "BR",
            },
            sameAs: [instagram],
          }),
        }}
      />
      <section className="hero shell">
        <div className="heroText">
          <div className="eyebrow">
            <span /> ESTÚDIO DE EPILAÇÃO
          </div>
          <h1>
            Leveza que
            <br />
            <i>começa na pele</i>
            <b>.</b>
          </h1>
          <p>
            Epilação com cera, cuidado e higiene em cada detalhe. Um momento só
            seu, no estúdio da Anny.
          </p>
          <div className="actions">
            <a className="btn" href="/agendar">
              <CalendarDays size={17} />
              Agendar horário
            </a>
            <a className="btn ghost" href={contact}>
              {phone ? <MessageCircle size={17} /> : <Instagram size={17} />}
              Falar com a Anny
            </a>
          </div>
          <div className="loc">
            <MapPin size={15} /> Atendimento em Buíque, PE
          </div>
        </div>
        <div className="heroVisual">
          <Image
            src="/media/cera.webp"
            alt="Cera dourada escorrendo de uma espátula de madeira"
            fill
            priority
            sizes="(max-width:760px) 100vw, 50vw"
          />
          <div className="photoSeal">
            <Butterfly size={32} />
            <i>by Anny</i>
          </div>
        </div>
      </section>
      <div className="benefits">
        <div className="shell">
          {[
            [ShieldCheck, "Higiene em cada etapa"],
            [Leaf, "Cuidado com a pele"],
            [Heart, "Atendimento acolhedor"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Heart;
            return (
              <span key={String(label)}>
                <I />
                {String(label)}
              </span>
            );
          })}
        </div>
      </div>
      <Catalog />
      <section id="sobre" className="tint">
        <div className="shell duo">
          <div>
            <div className="eyebrow">
              <span /> SOBRE A ANNY
            </div>
            <h2>
              Um cuidado <i>pessoal.</i>
            </h2>
          </div>
          <div>
            <h3>Hianny Camilla</h3>
            <p>
              Sou a Anny e recebo você no meu estúdio de epilação com cera em
              Buíque. Antes de começar, conversamos sobre a região que você quer
              cuidar, sua pele e o que deixa você mais confortável.
            </p>
            {studio.experience && <p>{studio.experience}</p>}
            {studio.training.map((x) => (
              <p key={x}>{x}</p>
            ))}
            <a className="textlink" href={instagram}>
              Conheça meu trabalho <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>
      <section className="shell section">
        <div className="eyebrow">
          <span /> SUA VISITA
        </div>
        <h2>
          Como <i>funciona</i>
        </h2>
        <ol className="steps">
          {[
            "Escolha as áreas que deseja epilar",
            "Encontre uma data e um horário livre",
            "Confira seus dados e reserve",
            "Venha ao estúdio no horário combinado",
          ].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </section>
      <section id="cuidados" className="tint">
        <div className="shell section">
          <div className="eyebrow">
            <span /> SEU BEM-ESTAR
          </div>
          <h2>
            Cuidados com <i>a pele</i>
          </h2>
          <div className="grid3">
            {[
              [
                ShieldCheck,
                "No estúdio",
                "Espátulas, toucas, luvas e máscaras descartáveis, cera aquecida em equipamento próprio e higienização entre atendimentos.",
              ],
              [
                Leaf,
                "Antes da sessão",
                "Venha com a pele limpa e seca. Evite exposição intensa ao sol e avise sobre irritações ou tratamentos na região.",
              ],
              [
                Flower2,
                "Nas primeiras 24 horas",
                "Prefira roupas soltas, evite banhos quentes e proteja a região do sol. Hidrate com um produto suave que sua pele já tolera.",
              ],
            ].map(([Icon, n, d]) => {
              const I = Icon as typeof Leaf;
              return (
                <article key={String(n)}>
                  <I />
                  <h3>{String(n)}</h3>
                  <p>{String(d)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="shell section">
        <div className="eyebrow">
          <span /> GALERIA
        </div>
        <h2>
          Por dentro <i>do estúdio</i>
        </h2>
        <div className="gallery">
          {studio.photos.map((x) => (
            <div key={x.title}>
              {x.src ? (
                <Image src={x.src} alt={x.alt} width={640} height={460} />
              ) : (
                <Camera />
              )}
              <strong>{x.title}</strong>
              {!x.src && <small>Foto em breve</small>}
            </div>
          ))}
        </div>
        <h3 className="mt">Depoimentos de clientes</h3>
        {studio.reviews.length ? (
          studio.reviews.map((r) => (
            <blockquote key={r.author}>
              {r.text}
              <cite> — {r.author}</cite>
            </blockquote>
          ))
        ) : (
          <p>Em breve, relatos compartilhados com autorização das clientes.</p>
        )}
      </section>
      <section className="tint">
        <div className="shell duo">
          <h2>
            Perguntas <i>frequentes</i>
          </h2>
          <div>
            {faq.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section id="contato" className="shell section">
        <div className="eyebrow">
          <span /> CONTATO
        </div>
        <h2>
          Encontre <i>a Anny</i>
        </h2>
        <p>
          {process.env.NEXT_PUBLIC_ADDRESS ||
            "Estúdio próprio em Buíque — PE. Consulte a localização antes da visita."}
        </p>
        <div className="actions">
          <a href="/agendar" className="btn">
            <CalendarDays size={16} />
            Agendar horário
          </a>
          <a href={instagram} className="btn ghost">
            <Instagram size={16} />
            @epilacaoby_anny
          </a>
        </div>
      </section>
    </>
  );
}
