"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profil = { id: number; nom: string; prix: number; slug: string };
type StartPaymentResult = { success?: boolean; identifier?: string; message?: string };

export default function PaygatePage() { return <Suspense fallback={<PageLoading />}><PaygateContent /></Suspense>; }

function PaygateContent() {
  const searchParams = useSearchParams();
  const profilId = searchParams.get("profil");
  const [profil, setProfil] = useState<Profil | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState<"FLOOZ" | "TMONEY">("TMONEY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { async function load() { try { if (!profilId) return; const { data, error } = await supabase.from("profils").select("id, nom, prix, slug").eq("id", Number(profilId)).single<Profil>(); if (!error) setProfil(data); } finally { setLoading(false); } } void load(); }, [profilId]);

  async function payer() {
    if (!profilId || !phoneNumber.trim()) { setMessage("Veuillez saisir le numéro utilisé pour le paiement."); return; }
    setSubmitting(true); setMessage("Demande envoyée. Confirmez le paiement sur votre téléphone...");
    try {
      const response = await fetch("/api/paygate/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profilId, phoneNumber, network }) });
      const result = (await response.json()) as StartPaymentResult;
      if (!response.ok || !result.success || !result.identifier) { setMessage(result.message || "Impossible de lancer le paiement."); setSubmitting(false); return; }
      window.location.href = `/payer?profil=${encodeURIComponent(profilId)}&identifier=${encodeURIComponent(result.identifier)}`;
    } catch { setMessage("Erreur de connexion. Veuillez réessayer."); setSubmitting(false); }
  }

  if (loading) return <PageLoading />;
  if (!profil) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Profil introuvable</main>;
  return <main className="min-h-screen bg-slate-950 px-6 py-10 text-white"><div className="mx-auto max-w-xl rounded-2xl bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">CyberCanvas Services</p><h1 className="mb-6 text-4xl font-bold">Paiement sécurisé</h1><div className="mb-4 rounded-xl bg-slate-800 p-4"><p className="text-slate-400">Profil WiFi</p><p className="text-xl font-bold">{profil.nom}</p></div><div className="mb-6 rounded-xl bg-slate-800 p-4"><p className="text-slate-400">Montant</p><p className="text-2xl font-bold text-cyan-300">{profil.prix} FCFA</p></div><label className="mb-2 block text-sm font-semibold text-slate-300">Numéro Flooz ou TMoney</label><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Exemple : 22892966152" inputMode="tel" disabled={submitting} className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-4 text-lg outline-none focus:border-cyan-400" /><label className="mb-2 block text-sm font-semibold text-slate-300">Réseau de paiement</label><select value={network} onChange={(event) => setNetwork(event.target.value as "FLOOZ" | "TMONEY")} disabled={submitting} className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-4 text-lg outline-none focus:border-cyan-400"><option value="TMONEY">TMoney</option><option value="FLOOZ">Flooz</option></select>{message && <div className="mb-4 rounded-xl bg-cyan-950 p-4 text-sm font-semibold text-cyan-100">{message}</div>}<button onClick={() => void payer()} disabled={submitting} className="w-full rounded-xl bg-cyan-500 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">{submitting ? "En attente de confirmation..." : "Payer maintenant"}</button></div></main>;
}
function PageLoading() { return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Chargement...</main>; }