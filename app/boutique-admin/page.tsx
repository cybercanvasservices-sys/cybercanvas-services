"use client";

import AdminShell from "@/components/AdminShell";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Box, PackagePlus, ShoppingBag, Trash2 } from "lucide-react";
import type { ShopProduct } from "@/lib/shop";

type Order = { id: number; produit_nom: string; quantite: number; montant: number; nom_client: string; telephone: string; ville: string; adresse: string; statut: string };
const initial = { nom: "", description: "", categorie: "Équipements réseau", prix: "", stock: "", image_url: "" };

export default function BoutiqueAdminPage() {
  const [produits, setProduits] = useState<ShopProduct[]>([]);
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const charger = useCallback(async () => {
    const [productsResponse, ordersResponse] = await Promise.all([fetch("/api/boutique/produits", { cache: "no-store" }), fetch("/api/boutique/commandes", { cache: "no-store" })]);
    const [productsData, ordersData] = await Promise.all([productsResponse.json(), ordersResponse.json()]);
    setProduits(productsData.produits || []);
    setCommandes(ordersData.commandes || []);
  }, []);

  useEffect(() => { void charger(); }, [charger]);

  async function publier(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const response = await fetch("/api/boutique/produits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.message || "Publication impossible.");
    setForm(initial); setMessage("Article publié dans la boutique."); void charger();
  }

  async function retirer(id: number) {
    if (!window.confirm("Retirer cet article de la boutique ?")) return;
    await fetch(`/api/boutique/produits?id=${id}`, { method: "DELETE" }); void charger();
  }

  async function changerStatut(id: number, statut: string) {
    await fetch("/api/boutique/commandes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) }); void charger();
  }

  return (
    <AdminShell title="Boutique" breadcrumb="Commerce">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="h-fit border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><PackagePlus className="text-[#0a7566]" /><div><h2 className="text-lg font-bold">Publier un article</h2><p className="text-sm text-slate-500">L’article sera immédiatement visible par les clients.</p></div></div>
          <form onSubmit={publier} className="mt-6 space-y-4"><Field label="Nom de l’article" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} /><label className="block text-sm font-semibold">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} className="mt-2 w-full rounded-lg border border-slate-300 p-3" /></label><Field label="Catégorie" value={form.categorie} onChange={(v) => setForm({ ...form, categorie: v })} /><div className="grid grid-cols-2 gap-3"><Field label="Prix (FCFA)" value={form.prix} onChange={(v) => setForm({ ...form, prix: v })} type="number" /><Field label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} type="number" /></div><Field label="Lien de l’image (facultatif)" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} type="url" />{message && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}<button disabled={saving} className="w-full rounded-lg bg-[#0a6f61] py-3 font-bold text-white">{saving ? "Publication..." : "Publier dans la boutique"}</button></form>
        </section>

        <div className="space-y-6"><section className="border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-bold">Articles publiés ({produits.length})</h2></div><div className="divide-y divide-slate-100">{produits.length === 0 ? <Empty text="Aucun article publié." /> : produits.map((p) => <div key={p.id} className="flex items-center gap-4 p-5"><div className="flex h-14 w-14 items-center justify-center bg-[#edf3f0]">{p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <Box className="text-[#0a7566]" />}</div><div className="min-w-0 flex-1"><p className="font-bold">{p.nom}</p><p className="text-sm text-slate-500">{p.prix.toLocaleString("fr-FR")} FCFA · Stock : {p.stock} · {p.actif ? "Visible" : "Retiré"}</p></div>{p.actif ? <button onClick={() => retirer(p.id)} title="Retirer" className="p-2 text-red-600"><Trash2 size={18} /></button> : null}</div>)}</div></section>
          <section className="border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-bold">Commandes et livraisons ({commandes.length})</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Commande</th><th className="p-4">Client</th><th className="p-4">Livraison</th><th className="p-4">Montant</th><th className="p-4">Statut</th></tr></thead><tbody>{commandes.map((o) => <tr key={o.id} className="border-t border-slate-100"><td className="p-4 font-semibold">#{o.id} · {o.produit_nom} × {o.quantite}</td><td className="p-4">{o.nom_client}<br/><a href={`tel:${o.telephone}`} className="text-[#0a7566]">{o.telephone}</a></td><td className="p-4">{o.adresse}, {o.ville}</td><td className="p-4 font-bold">{o.montant.toLocaleString("fr-FR")} FCFA</td><td className="p-4"><select value={o.statut} onChange={(e) => changerStatut(o.id, e.target.value)} className="rounded border border-slate-300 p-2"><option value="en_attente">En attente</option><option value="paye">Payée</option><option value="en_preparation">En préparation</option><option value="expedie">Expédiée</option><option value="livre">Livrée</option><option value="annule">Annulée</option></select></td></tr>)}</tbody></table>{commandes.length === 0 && <Empty text="Aucune commande pour le moment." />}</div></section>
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm font-semibold">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={type !== "url"} min={type === "number" ? 0 : undefined} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>; }
function Empty({ text }: { text: string }) { return <div className="p-10 text-center text-sm text-slate-500"><ShoppingBag className="mx-auto mb-3" />{text}</div>; }
