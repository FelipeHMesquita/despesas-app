"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { COR_OPTIONS } from "@/lib/types";
import type { CategoriaItem } from "@/lib/types";

interface CategoriasModalProps {
  categorias: CategoriaItem[];
  onAdd: (nome: string, label: string, cor: string) => Promise<CategoriaItem | null>;
  onUpdate: (id: string, updates: Partial<CategoriaItem>) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export function CategoriasModal({
  categorias,
  onAdd,
  onUpdate,
  onRemove,
  onClose,
}: CategoriasModalProps) {
  const [novoLabel, setNovoLabel] = useState("");
  const [novoCor, setNovoCor] = useState(COR_OPTIONS[0]);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCor, setEditCor] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLabel.trim()) return;
    setAdding(true);
    const nome = novoLabel.trim().toLowerCase().replace(/\s+/g, "_");
    const result = await onAdd(nome, novoLabel.trim(), novoCor);
    if (result) {
      setNovoLabel("");
      setNovoCor(COR_OPTIONS[0]);
    }
    setAdding(false);
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await onRemove(id);
    setRemovingId(null);
  }

  function startEdit(cat: CategoriaItem) {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditCor(cat.cor);
  }

  async function handleSaveEdit(id: string) {
    if (!editLabel.trim()) return;
    const success = await onUpdate(id, { label: editLabel.trim(), cor: editCor });
    if (success) setEditingId(null);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card relative z-10 w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-3/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="font-bold">Gerenciar categorias</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted transition-colors hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Categories list */}
        <div className="max-h-[350px] overflow-y-auto px-6 py-3">
          {categorias.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted/60">
              Nenhuma categoria cadastrada
            </p>
          ) : (
            <ul className="space-y-1">
              {categorias.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2/40"
                >
                  {editingId === cat.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {COR_OPTIONS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditCor(c)}
                            className={`h-5 w-5 rounded-full border-2 transition-transform ${
                              editCor === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="input-field flex-1 py-1.5 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="rounded-md p-1 text-accent transition-colors hover:bg-accent/10"
                        title="Salvar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md p-1 text-muted transition-colors hover:text-foreground"
                        title="Cancelar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.cor }}
                      />
                      <span className="flex-1 text-sm">{cat.label}</span>
                      <span className="text-xs text-muted/50">{cat.nome}</span>
                      <button
                        onClick={() => startEdit(cat)}
                        className="rounded-md p-1 text-muted/40 transition-colors hover:text-accent"
                        title="Editar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemove(cat.id)}
                        disabled={removingId === cat.id}
                        className="rounded-md p-1 text-muted/40 transition-colors hover:text-danger disabled:opacity-30"
                        title="Remover"
                      >
                        {removingId === cat.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border border-danger border-t-transparent" />
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add new category */}
        <form onSubmit={handleAdd} className="border-t border-surface-3/30 px-6 py-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {COR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNovoCor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  novoCor === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={novoLabel}
              onChange={(e) => setNovoLabel(e.target.value)}
              className="input-field flex-1"
              placeholder="Nome da nova categoria..."
              required
            />
            <button
              type="submit"
              disabled={adding || !novoLabel.trim()}
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
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
