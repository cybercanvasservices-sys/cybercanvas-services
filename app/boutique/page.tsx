"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Box, Check, Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";
import type { ShopProduct } from "@/lib/shop";

const emptyOrder = { nom_client: "", telephone: "", email: "", adresse: "", ville: "Lomé", note: "" };

export default function BoutiquePage() {
  const [produits, setProduits] = useState<ShopProduct[]>([]);
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [form, setForm] = useState(emptyOrder);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/boutique/produits", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setProduits(data.produits || []))
      .catch(() => setError("Impossible de charger la boutique."))
      .finally(() => setLoading(false));
  }, []);

  function choisir(produit: ShopProduct) {
    setSelected(produit);
    setQuantite(1);
    setError("");
  }

  async function commander(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/boutique/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, product_id: selected.id, quantite }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "Impossible de créer la commande.");
      setSubmitting(false);
      return;
    }
    window.location.href = result.paymentUrl;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#10231f]">
      <header className="border-b border-[#dfe5e1] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3"><BrandLogo /><span className="font-extrabold">CyberCanvas Services</span></Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#0a6f61]"><ArrowLeft size={17} /> Retour à l’accueil</Link>
        </div>
      </header>

      <section className="border-b border-[#dfe5e1] bg-[#102f2a] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8fd4c8]">Boutique CyberCanvas</p><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Équipez votre réseau avec du matériel fiable.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">Routeurs, points d’accès, câbles et équipements informatiques. Commandez, payez en ligne et faites-vous livrer.</p></div>
          <div className="flex gap-3 text-sm font-semibold text-white/80"><Truck /> Livraison à Lomé et environs</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        {loading ? <p className="py-16 text-center text-slate-500">Chargement des articles...</p> : produits.length === 0 ? (
          <div className="border border-slate-200 bg-white p-12 text-center"><Box className="mx-auto text-[#0a7566]" size={36} /><h2 className="mt-4 text-xl font-bold">La boutique est en préparation</h2><p className="mt-2 text-slate-500">Nos premiers équipements seront disponibles prochainement.</p></div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((produit) => (
              <article key={produit.id} className="flex flex-col overflow-hidden border border-[#dce4e0] bg-white shadow-sm">
                <div className="flex h-52 items-center justify-center bg-[#edf3f0]">
                  {produit.image_url ? <img src={produit.image_url} alt={produit.nom} className="h-full w-full object-cover" /> : <ShoppingBag size={48} className="text-[#6d8981]" />}
                </div>
                <div className="flex flex-1 flex-col p-6"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0a7566]">{produit.categorie}</p><h2 className="mt-2 text-xl font-bold">{produit.nom}</h2><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{produit.description}</p><div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-extrabold">{produit.prix.toLocaleString("fr-FR")} FCFA</p><p className="text-xs text-slate-500">{produit.stock} en stock</p></div><button onClick={() => choisir(produit)} className="rounded-lg bg-[#0a6f61] px-4 py-3 text-sm font-bold text-white hover:bg-[#075b50]">Commander</button></div></div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="mx-auto my-6 w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0a7566]">Commande avec livraison</p><h2 className="mt-2 text-2xl font-bold">{selected.nom}</h2></div><button onClick={() => setSelected(null)} aria-label="Fermer" className="p-2 text-slate-500"><X /></button></div>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-[#edf3f0] p-4"><div className="flex items-center gap-3"><button type="button" onClick={() => setQuantite(Math.max(1, quantite - 1))} className="rounded bg-white p-2"><Minus size={16} /></button><span className="min-w-6 text-center font-bold">{quantite}</span><button type="button" onClick={() => setQuantite(Math.min(selected.stock, quantite + 1))} className="rounded bg-white p-2"><Plus size={16} /></button></div><p className="text-xl font-extrabold">{(selected.prix * quantite).toLocaleString("fr-FR")} FCFA</p></div>
            <form onSubmit={commander} className="mt-6 grid gap-4 sm:grid-cols-2">
              <ShopInput label="Nom complet" value={form.nom_client} onChange={(value) => setForm({ ...form, nom_client: value })} required />
              <ShopInput label="Téléphone" value={form.telephone} onChange={(value) => setForm({ ...form, telephone: value })} required />
              <ShopInput label="Adresse e-mail" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" />
              <ShopInput label="Ville" value={form.ville} onChange={(value) => setForm({ ...form, ville: value })} required />
              <div className="sm:col-span-2"><ShopInput label="Adresse de livraison" value={form.adresse} onChange={(value) => setForm({ ...form, adresse: value })} required /></div>
              <div className="sm:col-span-2"><ShopInput label="Précisions pour la livraison (facultatif)" value={form.note} onChange={(value) => setForm({ ...form, note: value })} /></div>
              {error && <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              <button disabled={submitting} className="sm:col-span-2 flex items-center justify-center gap-2 rounded-lg bg-[#0a6f61] py-3.5 font-bold text-white disabled:opacity-60"><Check size={18} />{submitting ? "Préparation du paiement..." : "Continuer vers le paiement"}</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function ShopInput({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-[#0a7566] focus:ring-2 focus:ring-[#dcebe6]" /></label>;
}
