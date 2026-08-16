"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Search } from "lucide-react";
import AdminShell from "@/components/AdminShell";

type Commission = {
  id: number;
  profil: string;
  client: string;
  proprietaire: string;
  prix: number;
  commission: number;
  proprietaireNet: number;
  statut: string;
  created_at: string | null;
};

const money = (value: number) => `${value.toLocaleString("fr-FR")} FCFA`;

export default function CommissionsPage() {
  const [items, setItems] = useState<Commission[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Chargement des commissions...");

  useEffect(() => {
    fetch("/api/admin/commissions", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { commissions?: Commission[]; message?: string };
        if (!response.ok) throw new Error(result.message || "Chargement impossible.");
        setItems(result.commissions || []);
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.profil, item.client, item.proprietaire, item.statut, item.prix].join(" ").toLowerCase().includes(query)
    );
  }, [items, search]);

  const total = items.reduce((sum, item) => sum + item.commission, 0);

  return (
    <AdminShell title="Commissions administrateur" breadcrumb="Suivi des commissions">
      <section className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500"><Banknote size={28} /></div>
          <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-300">CyberCanvas Services</p><h1 className="mt-1 text-2xl font-black">Commissions sur chaque ticket</h1></div>
        </div>
        <div className="mt-6 rounded-xl bg-white/10 p-4"><p className="text-sm text-slate-300">Total des commissions</p><p className="mt-1 text-3xl font-black">{money(total)}</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black text-slate-900">Détail par ticket</h2><p className="mt-1 text-sm text-slate-500">10 % sont conservés par CyberCanvas et 90 % reviennent au propriétaire.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><Search size={17} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." className="w-full outline-none" /></label></div>
        {message && <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-600">{message}</p>}
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400"><th className="p-3">Date</th><th className="p-3">Profil</th><th className="p-3">Client</th><th className="p-3">Prix</th><th className="p-3">Commission 10 %</th><th className="p-3">Propriétaire</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3 text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString("fr-FR") : "-"}</td><td className="p-3 font-bold text-slate-900">{item.profil}</td><td className="p-3">{item.client}</td><td className="p-3">{money(item.prix)}</td><td className="p-3 font-black text-emerald-700">{money(item.commission)}</td><td className="p-3 text-slate-600">{item.proprietaire}</td></tr>)}</tbody></table>{!message && filtered.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Aucune commission trouvée.</p>}</div>
      </section>
    </AdminShell>
  );
}