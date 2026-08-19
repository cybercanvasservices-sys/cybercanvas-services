"use client";

import { useEffect, useMemo, useState } from "react";

type Vente = {
  id: number;
  montant: number | null;
  created_at: string;
};

type Ticket = {
  id: number;
  statut: string;
};

export default function StatistiquesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profilsCount, setProfilsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function chargerStatistiques() {
      try {
        const [ventesResponse, ticketsResponse, profilsResponse] =
          await Promise.all([
            fetch("/api/ventes", { cache: "no-store" }),
            fetch("/api/tickets", { cache: "no-store" }),
            fetch("/api/profils", { cache: "no-store" }),
          ]);

        const [ventesResult, ticketsResult, profilsResult] = await Promise.all([
          ventesResponse.json(),
          ticketsResponse.json(),
          profilsResponse.json(),
        ]);

        if (!active) return;

        setVentes(ventesResult.ventes || []);
        setTickets(ticketsResult.tickets || []);
        setProfilsCount((profilsResult.profils || []).length);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void chargerStatistiques();

    return () => {
      active = false;
    };
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
      profils: profilsCount,
      ventesAujourdhui: ventesAujourdhui.length,
    };
  }, [profilsCount, tickets, ventes]);

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