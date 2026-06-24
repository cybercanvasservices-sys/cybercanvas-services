"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { CheckCircle2, Clock, Search, Wallet, XCircle } from "lucide-react";

const RETRAITS_STORAGE_KEY = "cybercanvas-retraits-demo";

type RetraitStatus = "en_attente" | "valide" | "refuse";

type RetraitRequest = {
  id: number;
  nom: string;
  montant: number;
  commission?: number;
  net?: number;
  statut: RetraitStatus;
  createdAt: string;
};

function loadRetraits() {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      window.localStorage.getItem(RETRAITS_STORAGE_KEY) || "[]"
    ) as RetraitRequest[];
  } catch {
    return [];
  }
}

function statusLabel(status: RetraitStatus) {
  const labels = {
    en_attente: "En attente",
    valide: "Valide",
    refuse: "Refuse",
  } satisfies Record<RetraitStatus, string>;

  return labels[status];
}

export default function RetraitsPage() {
  const [retraits, setRetraits] = useState<RetraitRequest[]>(loadRetraits);
  const [search, setSearch] = useState("");

  useEffect(() => {
    window.localStorage.setItem(RETRAITS_STORAGE_KEY, JSON.stringify(retraits));
  }, [retraits]);

  const filteredRetraits = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return retraits;

    return retraits.filter((retrait) =>
      [retrait.nom, retrait.montant, statusLabel(retrait.statut)]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [retraits, search]);

  const totalEnAttente = retraits
    .filter((retrait) => retrait.statut === "en_attente")
    .reduce((total, retrait) => total + (retrait.net ?? retrait.montant), 0);

  function updateStatus(id: number, statut: RetraitStatus) {
    setRetraits((current) =>
      current.map((retrait) =>
        retrait.id === id
          ? {
              ...retrait,
              statut,
            }
          : retrait
      )
    );
  }

  return (
    <AdminShell title="Retraits" breadcrumb="Retraits">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              Validation admin
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Demandes de retrait
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Verifiez chaque demande avant paiement. Retrait minimum: 5000FCFA.
              Commission CyberCanvas Services: 10% sur chaque retrait.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            En attente: {totalEnAttente} FCFA
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Demandes"
            value={retraits.length}
            icon={<Wallet size={22} />}
            tone="bg-cyan-500"
          />
          <SummaryCard
            label="En attente"
            value={retraits.filter((retrait) => retrait.statut === "en_attente").length}
            icon={<Clock size={22} />}
            tone="bg-amber-500"
          />
          <SummaryCard
            label="Valides"
            value={retraits.filter((retrait) => retrait.statut === "valide").length}
            icon={<CheckCircle2 size={22} />}
            tone="bg-emerald-500"
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Liste des retraits
            </h2>
            <p className="text-sm text-slate-500">
              Validez uniquement apres verification du compte et du montant.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {filteredRetraits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Aucune demande de retrait pour le moment.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredRetraits.map((retrait) => (
              <article
                key={retrait.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {retrait.nom}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Demande du {new Date(retrait.createdAt).toLocaleString("fr-FR")}
                    </p>
                    <p className="mt-2 text-2xl font-black text-emerald-600">
                      {retrait.net ?? retrait.montant} FCFA
                    </p>
                    <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-600 sm:grid-cols-3">
                      <span>Brut: {retrait.montant} FCFA</span>
                      <span>
                        Commission: {retrait.commission ?? Math.round(retrait.montant * 0.1)} FCFA
                      </span>
                      <span>
                        Net client: {retrait.net ?? retrait.montant - Math.round(retrait.montant * 0.1)} FCFA
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <StatusBadge status={retrait.statut} />
                    {retrait.statut === "en_attente" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(retrait.id, "valide")}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-white hover:bg-emerald-600"
                        >
                          <CheckCircle2 size={16} />
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(retrait.id, "refuse")}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-black text-white hover:bg-red-600"
                        >
                          <XCircle size={16} />
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${tone}`}>
        {icon}
      </div>
      <p className="mt-4 text-sm font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: RetraitStatus }) {
  const styles = {
    en_attente: "bg-amber-100 text-amber-700",
    valide: "bg-emerald-100 text-emerald-700",
    refuse: "bg-red-100 text-red-700",
  } satisfies Record<RetraitStatus, string>;

  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-black ${styles[status]}`}>
      {statusLabel(status)}
    </span>
  );
}



