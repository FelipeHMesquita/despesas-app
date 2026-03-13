export interface CategoriaItem {
  id: string;
  created_at: string;
  user_id: string;
  nome: string;
  label: string;
  cor: string;
}

export interface Despesa {
  id: string;
  created_at: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  user_id: string;
}

export interface DespesaItem {
  id: string;
  created_at: string;
  user_id: string;
  categoria: string;
  nome: string;
}

// Default categories seeded on first login
export const DEFAULT_CATEGORIAS: { nome: string; label: string; cor: string }[] = [
  { nome: "ferramenta", label: "Ferramenta", cor: "#6ee7b7" },
  { nome: "anuncios", label: "Anúncios", cor: "#fbbf24" },
  { nome: "pessoal", label: "Pessoal", cor: "#a78bfa" },
  { nome: "imposto", label: "Imposto", cor: "#f87171" },
  { nome: "servicos", label: "Serviços", cor: "#38bdf8" },
];

export const COR_OPTIONS = [
  "#6ee7b7", "#34d399", "#fbbf24", "#f59e0b",
  "#a78bfa", "#8b5cf6", "#f87171", "#ef4444",
  "#38bdf8", "#0ea5e9", "#fb923c", "#e879f9",
  "#4ade80", "#facc15", "#94a3b8",
];
