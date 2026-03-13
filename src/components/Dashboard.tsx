"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { DespesaForm } from "@/components/DespesaForm";
import { DespesaTable } from "@/components/DespesaTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDespesaItens } from "@/lib/useDespesaItens";
import type { Despesa } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

type Periodo = "semana" | "mes" | "ano";

interface DashboardProps {
  user: User;
}

function getPeriodoBounds(periodo: Periodo, offset: number): { start: Date; end: Date } {
  const now = new Date();

  if (periodo === "mes") {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    return { start, end };
  }

  if (periodo === "ano") {
    const year = now.getFullYear() + offset;
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31),
    };
  }

  // semana
  const day = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { start: startOfWeek, end: endOfWeek };
}

function formatPeriodoLabel(periodo: Periodo, offset: number): string {
  const { start } = getPeriodoBounds(periodo, offset);

  if (periodo === "mes") {
    return start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  if (periodo === "ano") {
    return String(start.getFullYear());
  }
  // semana
  const { end } = getPeriodoBounds(periodo, offset);
  const s = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const e = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${s} – ${e}`;
}

export function Dashboard({ user }: DashboardProps) {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [offset, setOffset] = useState(0);
  const supabase = createClient();
  const { itensPorCategoria, addItem, removeItem } = useDespesaItens(user.id);

  const fetchDespesas = useCallback(async () => {
    const { data, error } = await supabase
      .from("despesas")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDespesas(data as Despesa[]);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchDespesas();

    const channel = supabase
      .channel("despesas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "despesas", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDespesas((prev) => [payload.new as Despesa, ...prev]);
          }
          if (payload.eventType === "DELETE") {
            setDespesas((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
          if (payload.eventType === "UPDATE") {
            setDespesas((prev) =>
              prev.map((d) => (d.id === payload.new.id ? (payload.new as Despesa) : d))
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDespesas]);

  const handleDeleteLocal = useCallback((id: string) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleEditLocal = useCallback((id: string, updates: Partial<Despesa>) => {
    setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Filtra despesas pelo período selecionado
  const { start, end } = getPeriodoBounds(periodo, offset);
  const despesasFiltradas = despesas.filter((d) => {
    const date = new Date(d.data + "T00:00:00");
    return date >= start && date <= end;
  });

  const totalPeriodo = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);
  const periodoLabel = formatPeriodoLabel(periodo, offset);

  function handleChangePeriodo(p: Periodo) {
    setPeriodo(p);
    setOffset(0);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-surface-3/50 bg-surface-1/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Despesas</h1>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>

          {/* Filtro de período — centro */}
          <div className="flex flex-1 items-center justify-center gap-3">
            {/* Navegação */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((o) => o - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-3 text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="min-w-[130px] text-center text-sm font-semibold capitalize tracking-tight">
                {periodoLabel}
              </span>
              <button
                onClick={() => setOffset((o) => o + 1)}
                disabled={offset >= 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-3 text-muted transition-colors hover:border-accent/40 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Segmented control */}
            <div className="flex items-center gap-1 rounded-lg border border-surface-3/50 bg-surface-2/40 p-1">
              {(["semana", "mes", "ano"] as Periodo[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleChangePeriodo(p)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    periodo === p
                      ? "bg-surface-0 text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Ano"}
                </button>
              ))}
            </div>
          </div>

          {/* Direita: total + theme + sair */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted capitalize">{periodoLabel}</p>
              <p className="font-mono text-lg font-medium text-accent">
                R$ {totalPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="rounded-lg border border-surface-3 px-3 py-2 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <DespesaForm userId={user.id} itensPorCategoria={itensPorCategoria} onAddItem={addItem} onRemoveItem={removeItem} />
          </div>
          <DespesaTable despesas={despesasFiltradas} loading={loading} onDelete={handleDeleteLocal} onEdit={handleEditLocal} itensPorCategoria={itensPorCategoria} />
        </div>
      </main>
    </div>
  );
}
