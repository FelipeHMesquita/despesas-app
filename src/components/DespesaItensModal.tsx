"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/lib/types";
import type { Categoria, DespesaItem } from "@/lib/types";

interface DespesaItensModalProps {
  categoriaInicial: Categoria;
  itensPorCategoria: (cat: Categoria) => DespesaItem[];
  onAdd: (categoria: Categoria, nome: string) => Promise<DespesaItem | null>;
  onRemove: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export function DespesaItensModal({
  categoriaInicial,
  itensPorCategoria,
  onAdd,
  onRemove,
  onClose,
}: DespesaItensModalProps) {
  const [categoria, setCategoria] = useState<Categoria>(categoriaInicial);
  const [novoNome, setNovoNome] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const itens = itensPorCategoria(categoria);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    setAdding(true);
    const result = await onAdd(categoria, novoNome);
    if (result) setNovoNome("");
    setAdding(false);
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await onRemove(id);
    setRemovingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card relative z-10 w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-3/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="font-bold">Gerenciar itens</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted transition-colors hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Categoria selector */}
        <div className="border-b border-surface-3/30 px-6 py-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoria(cat.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoria === cat.value
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {cat.label}
                <span className="ml-1 text-[10px] opacity-60">
                  ({itensPorCategoria(cat.value).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="max-h-[300px] overflow-y-auto px-6 py-3">
          {itens.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted/60">
              Nenhum item cadastrado nesta categoria
            </p>
          ) : (
            <ul className="space-y-1">
              {itens.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-2/40"
                >
                  <span className="text-sm">{item.nome}</span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    className="rounded-md p-1 text-muted/40 transition-colors hover:text-danger disabled:opacity-30"
                    title="Remover"
                  >
                    {removingId === item.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border border-danger border-t-transparent" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add new item */}
        <form onSubmit={handleAdd} className="flex gap-2 border-t border-surface-3/30 px-6 py-4">
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="input-field flex-1"
            placeholder="Nome do novo item..."
            required
          />
          <button
            type="submit"
            disabled={adding || !novoNome.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {adding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
