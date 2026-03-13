"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { DEFAULT_CATEGORIAS } from "@/lib/types";
import type { CategoriaItem } from "@/lib/types";

export function useCategorias(userId: string) {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCategorias = useCallback(async () => {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("user_id", userId)
      .order("label", { ascending: true });

    if (!error && data) {
      if (data.length === 0) {
        // Seed defaults on first use
        const rows = DEFAULT_CATEGORIAS.map((c) => ({ ...c, user_id: userId }));
        const { data: seeded } = await supabase.from("categorias").insert(rows).select();
        if (seeded) setCategorias(seeded as CategoriaItem[]);
      } else {
        setCategorias(data as CategoriaItem[]);
      }
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  function corPorNome(nome: string): string {
    return categorias.find((c) => c.nome === nome)?.cor ?? "#94a3b8";
  }

  function labelPorNome(nome: string): string {
    return categorias.find((c) => c.nome === nome)?.label ?? nome;
  }

  async function addCategoria(nome: string, label: string, cor: string) {
    const { data, error } = await supabase
      .from("categorias")
      .insert({ user_id: userId, nome: nome.trim().toLowerCase().replace(/\s+/g, "_"), label: label.trim(), cor })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        alert("Esta categoria já existe.");
      } else {
        alert(`Erro ao adicionar: ${error.message}`);
      }
      return null;
    }
    setCategorias((prev) => [...prev, data as CategoriaItem].sort((a, b) => a.label.localeCompare(b.label)));
    return data as CategoriaItem;
  }

  async function updateCategoria(id: string, updates: Partial<CategoriaItem>) {
    const { error } = await supabase.from("categorias").update(updates).eq("id", id);
    if (error) {
      alert(`Erro ao atualizar: ${error.message}`);
      return false;
    }
    setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    return true;
  }

  async function removeCategoria(id: string) {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      alert(`Erro ao remover: ${error.message}`);
      return false;
    }
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    return true;
  }

  return { categorias, loading, corPorNome, labelPorNome, addCategoria, updateCategoria, removeCategoria, refetch: fetchCategorias };
}
