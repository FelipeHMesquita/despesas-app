"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CATEGORIAS } from "@/lib/types";
import type { Categoria } from "@/lib/types";

interface DespesaFormProps {
  userId: string;
}

export function DespesaForm({ userId }: DespesaFormProps) {
  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("ferramenta");
  const [valor, setValor] = useState("");
  const [valorDisplay, setValorDisplay] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  function formatCurrency(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      setValor("");
      setValorDisplay("");
      return;
    }
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    setValor(reais.toString());
    setValorDisplay(
      reais.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !valor) return;

    setSaving(true);
    setSuccess(false);

    const { error } = await supabase.from("despesas").insert({
      data,
      descricao: descricao.trim(),
      categoria,
      valor: parseFloat(valor),
      user_id: userId,
    });

    if (!error) {
      setDescricao("");
      setValor("");
      setValorDisplay("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }

    setSaving(false);
  }

  return (
    <div className="glass-card p-6">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted">
        Nova despesa
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Despesa</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="input-field"
            placeholder="Ex: Meta Ads campanha janeiro"
            required
          />
        </div>

        <div>
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

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-0 border-t-transparent" />
          ) : success ? (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Salvo!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Registrar
            </>
          )}
        </button>
      </form>
    </div>
  );
}
