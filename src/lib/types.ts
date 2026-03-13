export type Categoria =
  | "ferramenta"
  | "anuncios"
  | "pessoal"
  | "imposto"
  | "servicos";

export interface Despesa {
  id: string;
  created_at: string;
  data: string;
  descricao: string;
  categoria: Categoria;
  valor: number;
  user_id: string;
}

export const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: "ferramenta", label: "Ferramenta" },
  { value: "anuncios", label: "Anúncios" },
  { value: "pessoal", label: "Pessoal" },
  { value: "imposto", label: "Imposto" },
  { value: "servicos", label: "Serviços" },
];

export const CATEGORIA_CORES: Record<Categoria, string> = {
  ferramenta: "#6ee7b7",
  anuncios: "#fbbf24",
  pessoal: "#a78bfa",
  imposto: "#f87171",
  servicos: "#38bdf8",
};
