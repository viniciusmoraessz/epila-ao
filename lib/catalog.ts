export type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number | null;
  category: string;
  active: boolean;
};
export const examples: Service[] = [
  {
    id: 1,
    name: "Axila",
    description: "Cuidado delicado para as axilas.",
    duration: 15,
    category: "Corporal",
    price: null,
    active: true,
  },
  {
    id: 2,
    name: "Virilha simples",
    description: "Contorno da virilha, respeitando sua preferência.",
    duration: 25,
    category: "Íntima",
    price: null,
    active: true,
  },
  {
    id: 3,
    name: "Virilha completa",
    description: "Epilação íntima com privacidade e acolhimento.",
    duration: 45,
    category: "Íntima",
    price: null,
    active: true,
  },
  {
    id: 4,
    name: "Meia perna",
    description: "Dos joelhos aos tornozelos.",
    duration: 30,
    category: "Corporal",
    price: null,
    active: true,
  },
  {
    id: 5,
    name: "Perna inteira",
    description: "Cuidado das coxas aos tornozelos.",
    duration: 50,
    category: "Corporal",
    price: null,
    active: true,
  },
  {
    id: 6,
    name: "Buço",
    description: "Precisão e delicadeza acima dos lábios.",
    duration: 10,
    category: "Facial",
    price: null,
    active: true,
  },
  {
    id: 7,
    name: "Sobrancelha",
    description: "Limpeza dos pelos ao redor das sobrancelhas.",
    duration: 20,
    category: "Facial",
    price: null,
    active: true,
  },
  {
    id: 8,
    name: "Braços",
    description: "Epilação da região dos braços.",
    duration: 30,
    category: "Corporal",
    price: null,
    active: true,
  },
  {
    id: 9,
    name: "Costas",
    description: "Atendimento dedicado à região das costas.",
    duration: 40,
    category: "Corporal",
    price: null,
    active: true,
  },
  {
    id: 10,
    name: "Barriga",
    description: "Remoção dos pelos na região abdominal.",
    duration: 20,
    category: "Corporal",
    price: null,
    active: true,
  },
  {
    id: 11,
    name: "Combo de áreas",
    description: "Axilas e meia perna na mesma visita.",
    duration: 45,
    category: "Combos",
    price: null,
    active: true,
  },
];
export const money = (n: number | null) =>
  n === null
    ? "Sob consulta"
    : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const instagram = "https://www.instagram.com/epilacaoby_anny/";
export const phone = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(
  /\D/g,
  "",
);
export const contact = phone ? "https://wa.me/" + phone : instagram;
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Recife" }).format(
    new Date(),
  );
