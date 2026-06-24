"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Vente = {
  id: number;
  montant: number | null;
  created_at: string;
};

type Ticket = {
  id: number;
  statut: string;
};

type Profil = {
  id: number;
};

export default function StatistiquesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profils, setProfils] = useState<Profil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function chargerStatistiques() {
      const [
        ventesResult,
        ticketsResult,
        profilsResult,
      ] = await Promise.all([
        supabase
          .from("ventes")
          .select("id, montant, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("tickets")
          .select("id, statut"),
        supabase
          .from("profils")
          .select("id"),
      ]);

      if (ventesResult.error) {
        console.error(ventesResult.error);
      }

      if (ticketsResult.error) {
        console.error(ticketsResult.error);
      }

      if (profilsResult.error) {
        console.error(profilsResult.error);
      }

      setVentes(ventesResult.data || []);
      setTickets(ticketsResult.data || []);
      setProfils(profilsResult.data || []);
      setLoading(false);
    }

    void chargerStatistiques();
  }, []);

  const stats = useMemo(() => {
    const revenus = ventes.reduce(
      (total, vente) => total + (vente.montant || 0),
      0
    );

    const ticketsVendus = tickets.filter(
      (ticket) => ticket.statut === "vendu"
    ).length;

    const ticketsDisponibles = tickets.filter(
      (ticket) => ticket.statut === "disponible"
    ).length;

    const aujourd = new Date().toDateString();
    const ventesAujourdhui = ventes.filter(
      (vente) =>
        new Date(vente.created_at).toDateString() === aujourd
    );

    return {
      revenus,
      ticketsVendus,
      ticketsDisponibles,
      profils: profils.length,
      ventesAujourdhui: ventesAujourdhui.length,
    };
  }, [profils.length, tickets, ventes]);

  return (
    <main className="min-h-screen p-8 text-white">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
          Pilotage
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Statistiques
        </h1>

        <p className="mt-3 max-w-2xl text-slate-400">
          Suivez les ventes, les tickets disponibles et les revenus
          de votre plateforme WiFi.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-slate-300">
          Chargement des statistiques...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Revenus"
            value={`${stats.revenus} FCFA`}
            tone="text-yellow-300"
          />
          <StatCard
            label="Tickets vendus"
            value={stats.ticketsVendus}
            tone="text-green-300"
          />
          <StatCard
            label="Tickets disponibles"
            value={stats.ticketsDisponibles}
            tone="text-cyan-300"
          />
          <StatCard
            label="Profils"
            value={stats.profils}
            tone="text-violet-300"
          />
          <StatCard
            label="Ventes aujourd'hui"
            value={stats.ventesAujourdhui}
            tone="text-emerald-300"
          />
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${tone}`}>
        {value}
      </p>
    </div>
  );
}
