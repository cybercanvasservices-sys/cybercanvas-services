"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { CheckCircle2, Clock, Search, Send, Wallet, XCircle } from "lucide-react";

const RETRAIT_MINIMUM = 2000;
type RetraitStatus = "en_attente" | "valide" | "refuse";

type RetraitRequest = {
  id: number;
  owner_email: string;
  routeur_id?: string | number | null;
  client_nom: string;
  client_telephone?: string | null;
  numero_paiement: string;
  montant: number;
  commission: number;
  net: number;
  statut: RetraitStatus;
  note_admin?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type CyberOption = { id: string | number; nom: string; numero_retrait?: string | null };

type SessionResponse = {
  role?: "admin" | "client" | null;
  client?: {
    nom?: string | null;
    telephone?: string | null;
  } | null;
};

function statusLabel(status: RetraitStatus) {
  const labels = {
    en_attente: "En attente",
    valide: "Valide",
    refuse: "Refuse",
  } satisfies Record<RetraitStatus, string>;

  return labels[status];
}

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

function calculateAmounts(montant: number) {
  return { commission: 0, net: Math.max(montant, 0) };
}

export default function RetraitsPage() {
  const [retraits, setRetraits] = useState<RetraitRequest[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"admin" | "client" | null>(null);
  const [montant, setMontant] = useState("");
  const [numeroPaiement, setNumeroPaiement] = useState("");
  const [cybers, setCybers] = useState<CyberOption[]>([]);
  const [selectedCyberId, setSelectedCyberId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const result = (await response.json()) as SessionResponse;

      setRole(result.role || null);
      setNumeroPaiement(result.client?.telephone || "");
    }

    async function loadRetraits() {
      const response = await fetch("/api/retraits", { cache: "no-store" });
      const result = (await response.json()) as {
        retraits?: RetraitRequest[];
        message?: string;
      };

      if (!response.ok) {
        setError(result.message || "Chargement des retraits impossible.");
        return;
      }

      setRetraits(result.retraits || []);
    }

    async function loadCybers() {
      const response = await fetch("/api/routers", { cache: "no-store" });
      const result = (await response.json()) as { routeurs?: CyberOption[] };
      const available = result.routeurs || [];
      setCybers(available);
      if (available.length === 1) {
        setSelectedCyberId(String(available[0].id));
        setNumeroPaiement(available[0].numero_retrait || "");
      }
    }

    void loadSession();
    void loadCybers();
    void loadRetraits();
  }, []);

  const filteredRetraits = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return retraits;

    return retraits.filter((retrait) =>
      [
        retrait.client_nom,
        retrait.owner_email,
        retrait.numero_paiement,
        retrait.montant,
        retrait.net,
        statusLabel(retrait.statut),
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [retraits, search]);

  const totalEnAttente = retraits
    .filter((retrait) => retrait.statut === "en_attente")
    .reduce((total, retrait) => total + retrait.net, 0);
  const montantNumber = Number(montant || 0);
  const preview = calculateAmounts(montantNumber);

  async function refreshRetraits() {
    const response = await fetch("/api/retraits", { cache: "no-store" });
    const result = (await response.json()) as {
      retraits?: RetraitRequest[];
      message?: string;
    };

    if (!response.ok) {
      setError(result.message || "Actualisation impossible.");
      return;
    }

    setRetraits(result.retraits || []);
  }

  async function requestRetrait(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const response = await fetch("/api/retraits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        montant: montantNumber,
        numero_paiement: numeroPaiement,
        routeur_id: selectedCyberId ? Number(selectedCyberId) : null,
      }),
    });
    const result = (await response.json()) as {
      retrait?: RetraitRequest;
      message?: string;
    };

    setLoading(false);

    if (!response.ok || !result.retrait) {
      setError(result.message || "Demande de retrait impossible.");
      return;
    }

    setMontant("");
    setMessage("Demande de retrait envoyee. Elle sera verifiee avant paiement.");
    await refreshRetraits();
  }

  async function updateStatus(id: number, statut: RetraitStatus) {
    setError("");
    setMessage("");

    const response = await fetch("/api/retraits", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, statut }),
    });
    const result = (await response.json()) as {
      retrait?: RetraitRequest;
      message?: string;
    };

    if (!response.ok || !result.retrait) {
      setError(result.message || "Modification impossible.");
      return;
    }

    setRetraits((current) =>
      current.map((retrait) =>
        retrait.id === id ? result.retrait as RetraitRequest : retrait
      )
    );
  }

  return (
    <AdminShell title="Retraits" breadcrumb="Retraits">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
              {role === "admin" ? "Validation admin" : "Demande client"}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {role === "admin" ? "Demandes de retrait" : "Mes retraits"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Retrait minimum: {RETRAIT_MINIMUM} FCFA. Commission CyberCanvas
              La commission de 10% est deja prelevee sur chaque ticket vendu.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            En attente: {formatMoney(totalEnAttente)}
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

      {role === "client" && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Nouvelle demande
          </h2>
          <form className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={requestRetrait}>
            <select
              value={selectedCyberId}
              onChange={(event) => {
                const value = event.target.value;
                const cyber = cybers.find((item) => String(item.id) === value);
                setSelectedCyberId(value);
                setNumeroPaiement(cyber?.numero_retrait || "");
              }}
              required
              className="rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
            >
              <option value="">Choisir le Cyber</option>
              {cybers.map((cyber) => (
                <option key={cyber.id} value={cyber.id}>{cyber.nom}</option>
              ))}
            </select>
            <input
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              type="number"
              min={RETRAIT_MINIMUM}
              placeholder="Montant brut"
              className="rounded-lg border border-slate-300 p-3 outline-none focus:border-cyan-500"
            />
            <input
              value={numeroPaiement}
              onChange={(event) => setNumeroPaiement(event.target.value)}
              placeholder="Numero enregistré du Cyber"
              readOnly
              className="rounded-lg border border-slate-300 p-3 outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Send size={17} />
              Envoyer
            </button>
          </form>
          {montantNumber > 0 && (
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <Info label="Montant brut" value={formatMoney(montantNumber)} />
              <Info label="Commission 10%" value={formatMoney(preview.commission)} />
              <Info label="Net a payer" value={formatMoney(preview.net)} />
            </div>
          )}
        </section>
      )}

      {(message || error) && (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm font-bold ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Historique des retraits
            </h2>
            <p className="text-sm text-slate-500">
              {role === "admin"
                ? "Validez uniquement apres verification du compte et du montant."
                : "Suivez ici vos demandes et leur statut."}
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
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-slate-900">
                      {retrait.client_nom || retrait.owner_email}
                    </h3>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {retrait.owner_email} - {retrait.numero_paiement}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Demande du {new Date(retrait.created_at).toLocaleString("fr-FR")}
                    </p>
                    <p className="mt-2 text-2xl font-black text-emerald-600">
                      {formatMoney(retrait.net)}
                    </p>
                    <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-600 sm:grid-cols-3">
                      <span>Brut: {formatMoney(retrait.montant)}</span>
                      <span>Commission: {formatMoney(retrait.commission)}</span>
                      <span>Net client: {formatMoney(retrait.net)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <StatusBadge status={retrait.statut} />
                    {role === "admin" && retrait.statut === "en_attente" && (
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
