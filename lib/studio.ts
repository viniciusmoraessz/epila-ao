// Preencha somente com materiais enviados ou aprovados pela Anny.
export const studio: {
  training: string[];
  experience: string;
  photos: { title: string; src: string; alt: string }[];
  reviews: { author: string; text: string }[];
} = {
  training: [],
  experience: "",
  photos: ["O espaço", "Os materiais", "Os atendimentos"].map((title) => ({
    title,
    src: "",
    alt: "",
  })),
  reviews: [],
};
