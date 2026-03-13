"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CATEGORIA_CORES, CATEGORIAS } from "@/lib/types";
import type { Despesa, Categoria } from "@/lib/types";

interface DespesaTableProps {
  despesas: Despesa[];
  loading: boolean;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

// Modal de confirmação de exclusão
function ModalExcluir({
  despesa,
  onConfirm,
  onCancel,
  loading,
}: {
  despesa: Despesa;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="glass-card relative z-10 w-full max-w-sm p-8 text-center animate-fade-in">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-bold">Excluir despesa</h3>
        <p className="mb-1 text-sm text-muted">Tem certeza que deseja excluir</p>
        <p className="mb-1 text-sm font-medium">"{despesa.descricao}"?</p>
        <p className="mb-7 text-xs text-muted/70">Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-surface-3 px-4 py-2.5 text-sm text-muted transition-colors hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de edição
function ModalEditar({
  despesa,
  onSave,
  onCancel,
  loading,
}: {
  despesa: Despesa;
  onSave: (data: Partial<Despesa>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [data, setData] = useState(despesa.data);
  const [descricao, setDescricao] = useState(despesa.descricao);
  const [categoria, setCategoria] = useState<Categoria>(despesa.categoria);
  const [valor, setValor] = useState(despesa.valor);
  const [valorDisplay, setValorDisplay] = useState(
    despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  function formatCurrency(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setValor(0);
      setValorDisplay("");
      return;
    }
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    setValor(reais);
    setValorDisplay(
      reais.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ data, descricao: descricao.trim(), categoria, valor });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="glass-card relative z-10 w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-3/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="font-bold">Editar despesa</h3>
          </div>
          <button onClick={onCancel} className="rounded-md p-1.5 text-muted transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="input-field font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="input-field cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted">Despesa</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-muted">Valor (R$)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={valorDisplay}
                onChange={(e) => formatCurrency(e.target.value)}
                className="input-field pl-10 font-mono"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-lg border border-surface-3 px-4 py-2.5 text-sm text-muted transition-colors hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-surface-0 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-0 border-t-transparent" />
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tabela principal
export function DespesaTable({ despesas, loading }: DespesaTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Despesa | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const supabase = createClient();

  async function handleDelete(despesa: Despesa) {
    setDeletingId(despesa.id);
    const { error } = await supabase.from("despesas").delete().eq("id", despesa.id);
    if (error) {
      console.error("Erro ao excluir:", error);
      alert(`Erro ao excluir: ${error.message}`);
    }
    setDeletingId(null);
    setConfirmDelete(null);
  }

  async function handleEdit(id: string, updates: Partial<Despesa>) {
    setSavingEdit(true);
    const { error } = await supabase.from("despesas").update(updates).eq("id", id);
    if (error) {
      console.error("Erro ao editar:", error);
      alert(`Erro ao editar: ${error.message}`);
    }
    setSavingEdit(false);
    setEditingDespesa(null);
  }

  if (loading) {
    return (
      <div className="glass-card flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (despesas.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
          <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted">Nenhuma despesa registrada</p>
        <p className="mt-1 text-xs text-muted/60">Use o formulário ao lado para adicionar</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="border-b border-surface-3/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Registros</h2>
            <span className="rounded-full bg-surface-2 px-3 py-1 font-mono text-xs text-muted">
              {despesas.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-3/30">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Categoria
                </th>
                <th className="w-[300px] px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Despesa
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((despesa, i) => (
                <tr
                  key={despesa.id}
                  className="animate-slide-in border-b border-surface-3/20 transition-colors hover:bg-surface-2/30"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <td className="whitespace-nowrap px-6 py-3.5 font-mono text-sm text-muted">
                    {formatDate(despesa.data)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${CATEGORIA_CORES[despesa.categoria]}15`,
                        color: CATEGORIA_CORES[despesa.categoria],
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: CATEGORIA_CORES[despesa.categoria] }}
                      />
                      {despesa.categoria}
                    </span>
                  </td>
                  <td className="w-[300px] px-6 py-3.5 text-sm">{despesa.descricao}</td>
                  <td className="whitespace-nowrap px-6 py-3.5 font-mono text-sm font-medium">
                    R$ {despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* Editar */}
                      <button
                        onClick={() => setEditingDespesa(despesa)}
                        className="rounded-md p-1.5 text-muted/50 transition-colors hover:bg-surface-2 hover:text-white"
                        title="Editar"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {/* Excluir */}
                      <button
                        onClick={() => setConfirmDelete(despesa)}
                        disabled={deletingId === despesa.id}
                        className="rounded-md p-1.5 text-muted/50 transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                        title="Excluir"
                      >
                        {deletingId === despesa.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border border-danger border-t-transparent" />
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Excluir */}
      {confirmDelete && (
        <ModalExcluir
          despesa={confirmDelete}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          loading={deletingId === confirmDelete.id}
        />
      )}

      {/* Modal Editar */}
      {editingDespesa && (
        <ModalEditar
          despesa={editingDespesa}
          onSave={(data) => handleEdit(editingDespesa.id, data)}
          onCancel={() => setEditingDespesa(null)}
          loading={savingEdit}
        />
      )}
    </>
  );
}
