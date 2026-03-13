"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { DespesaItem } from "@/lib/types";

export function useDespesaItens(userId: string) {
  const [itens, setItens] = useState<DespesaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchItens = useCallback(async () => {
    const { data, error } = await supabase
      .from("despesa_itens")
      .select("*")
      .eq("user_id", userId)
      .order("nome", { ascending: true });

    if (!error && data) {
      setItens(data as DespesaItem[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchItens();
  }, [fetchItens]);

  const itensPorCategoria = useCallback(
    (cat: string) => itens.filter((i) => i.categoria === cat),
    [itens]
  );

  async function addItem(categoria: string, nome: string) {
    const { data, error } = await supabase
      .from("despesa_itens")
      .insert({ user_id: userId, categoria, nome: nome.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        alert("Este item já existe nesta categoria.");
      } else {
        alert(`Erro ao adicionar: ${error.message}`);
      }
      return null;
    }
    setItens((prev) => [...prev, data as DespesaItem].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data as DespesaItem;
  }

  async function updateItem(id: string, nome: string) {
    const { error } = await supabase.from("despesa_itens").update({ nome: nome.trim() }).eq("id", id);
    if (error) {
      alert(`Erro ao atualizar: ${error.message}`);
      return false;
    }
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, nome: nome.trim() } : i)));
    return true;
  }

  async function removeItem(id: string) {
    const { error } = await supabase.from("despesa_itens").delete().eq("id", id);
    if (error) {
      alert(`Erro ao remover: ${error.message}`);
      return false;
    }
    setItens((prev) => prev.filter((i) => i.id !== id));
    return true;
  }

  return { itens, loading, itensPorCategoria, addItem, updateItem, removeItem, refetch: fetchItens };
}
