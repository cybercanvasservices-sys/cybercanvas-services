"use client";

import { Copy, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";

interface Vente {
  id: number;
  montant: number;
  telephone: string;
  statut?: string | null;
  created_at: string;
  profils: {
    nom: string;
  } | null;
}

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState("tout");

  useEffect(() => {
    async function chargerVentes() {
      const response = await fetch("/api/ventes", { cache: "no-store" });
      const result = (await response.json()) as {
        ventes?: Vente[];
        message?: string;
      };

      if (!response.ok) {
        console.error(result.message || "Chargement des recettes impossible.");
        return;
      }

      setVentes(result.ventes || []);
    }

    void chargerVentes();
  }, []);

  const ventesFiltrees = useMemo(() => {
    const maintenant = new Date();
    const query = search.trim().toLowerCase();

    return ventes.filter((vente) => {
      const dateVente = new Date(vente.created_at);
      const matchPeriode =
        periode === "tout" ||
        (periode === "jour" &&
          dateVente.toDateString() === maintenant.toDateString()) ||
        (periode === "mois" &&
          dateVente.getMonth() === maintenant.getMonth() &&
          dateVente.getFullYear() === maintenant.getFullYear());

      const matchSearch =
        !query ||
        [
          vente.profils?.nom,
          vente.telephone,
          vente.montant,
          vente.statut,
          new Date(vente.created_at).toLocaleString(),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchPeriode && matchSearch;
    });
  }, [periode, search, ventes]);

  const revenus = ventes.reduce(
    (total, vente) => total + (vente.montant || 0),
    0
  );

  const revenusFiltres = ventesFiltrees.reduce(
    (total, vente) => total + (vente.montant || 0),
    0
  );

  const aujourdHui = ventes.filter((vente) => {
    const dateVente = new Date(vente.created_at);
    const aujourd = new Date();
    return dateVente.toDateString() === aujourd.toDateString();
  });

  const ceMois = ventes.filter((vente) => {
    const dateVente = new Date(vente.created_at);
    const maintenant = new Date();
    return (
      dateVente.getMonth() === maintenant.getMonth() &&
      dateVente.getFullYear() === maintenant.getFullYear()
    );
  });

  const resumeGroupes = useMemo(() => {
    const map = new Map<string, { nom: string; ventes: number; revenus: number }>();

    ventesFiltrees.forEach((vente) => {
      const nom = vente.profils?.nom || "Profil inconnu";
      const current = map.get(nom) || { nom, ventes: 0, revenus: 0 };
      current.ventes += 1;
      current.revenus += vente.montant || 0;
      map.set(nom, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenus - a.revenus);
  }, [ventesFiltrees]);

  async function copierResume() {
    const lignes = ventesFiltrees.map((vente) =>
      [
        new Date(vente.created_at).toLocaleString(),
        vente.profils?.nom || "Profil inconnu",
        `${vente.montant} FCFA`,
        vente.telephone || "-",
        vente.statut || "paye",
      ].join(" | ")
    );

    await navigator.clipboard.writeText(lignes.join("\n"));
    window.alert("Resume des recettes copie.");
  }

  return (
    <AdminShell title="Mes Recettes" breadcrumb="Offres WiFi / Recettes">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Portefeuille et recettes
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Suivez les ventes, recherchez un paiement et copiez un resume pour
            vos rapports.
          </p>
        </div>

        <button
          type="button"
          onClick={copierResume}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-200 px-4 py-3 text-sm font-bold text-cyan-700 hover:bg-cyan-50"
        >
          <Copy size={17} />
          Copier le resume
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Ventes totales" value={ventes.length} />
        <Stat label="Aujourd'hui" value={aujourdHui.length} tone="text-green-600" />
        <Stat label="Ce mois" value={ceMois.length} tone="text-cyan-600" />
        <Stat label="Revenus" value={`${revenus} FCFA`} tone="text-yellow-600" />
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <label className="block text-sm font-bold text-slate-700">
            Recherche
            <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-cyan-500">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Profil, telephone, montant, statut..."
                className="w-full bg-transparent py-1 text-slate-900 outline-none"
              />
            </span>
          </label>

          <label className="block text-sm font-bold text-slate-700">
            Periode
            <select
              value={periode}
              onChange={(event) => setPeriode(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500"
            >
              <option value="tout">Tout</option>
              <option value="jour">Aujourd hui</option>
              <option value="mois">Ce mois</option>
            </select>
          </label>

          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-500">Selection</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {revenusFiltres} FCFA
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Resume par groupe
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Classement selon les recettes de la selection.
          </p>

          <div className="mt-5 grid gap-3">
            {resumeGroupes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                Aucune recette dans cette selection.
              </div>
            ) : (
              resumeGroupes.map((groupe) => (
                <div
                  key={groupe.nom}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{groupe.nom}</p>
                      <p className="text-sm text-slate-500">
                        {groupe.ventes} vente(s)
                      </p>
                    </div>
                    <p className="font-black text-emerald-600">
                      {groupe.revenus} FCFA
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Historique des ventes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {ventesFiltrees.length} vente(s) affichee(s) sur {ventes.length}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="p-3">Date</th>
                  <th className="p-3">Profil</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Telephone</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {ventesFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Aucune vente trouvee.
                    </td>
                  </tr>
                ) : (
                  ventesFiltrees.map((vente) => (
                    <tr
                      key={vente.id}
                      className="border-b border-slate-100 text-slate-700 hover:bg-slate-50"
                    >
                      <td className="p-3">
                        {new Date(vente.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {vente.profils?.nom || "Profil inconnu"}
                      </td>
                      <td className="p-3 font-bold">{vente.montant} FCFA</td>
                      <td className="p-3">{vente.telephone || "-"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                          {vente.statut || "paye"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  tone = "text-slate-900",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <h2 className={`mt-2 text-2xl font-black ${tone}`}>{value}</h2>
    </div>
  );
}
