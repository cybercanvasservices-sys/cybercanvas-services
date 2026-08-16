"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LockKeyhole, Phone, ShieldCheck, Wifi } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profil = { id: number; nom: string; prix: number; slug: string };
type StartPaymentResult = { success?: boolean; identifier?: string; message?: string };

export default function PaygatePage() {
  return <Suspense fallback={<PageLoading />}><PaygateContent /></Suspense>;
}

function PaygateContent() {
  const searchParams = useSearchParams();
  const profilId = searchParams.get("profil");
  const [profil, setProfil] = useState<Profil | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState<"FLOOZ" | "TMONEY">("TMONEY");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (!profilId) return;
        const { data, error } = await supabase.from("profils").select("id, nom, prix, slug").eq("id", Number(profilId)).single<Profil>();
        if (!error) setProfil(data);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [profilId]);

  async function payer() {
    if (!profilId || !phoneNumber.trim()) {
      setMessage("Veuillez saisir le numéro utilisé pour le paiement.");
      return;
    }
    setSubmitting(true);
    setMessage("Demande envoyée. Confirmez le paiement sur votre téléphone...");
    try {
      const response = await fetch("/api/paygate/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profilId, phoneNumber, network }) });
      const result = (await response.json()) as StartPaymentResult;
      if (!response.ok || !result.success || !result.identifier) {
        setMessage(result.message || "Impossible de lancer le paiement.");
        setSubmitting(false);
        return;
      }
      window.location.href = `/payer?profil=${encodeURIComponent(profilId)}&identifier=${encodeURIComponent(result.identifier)}`;
    } catch {
      setMessage("Erreur de connexion. Veuillez réessayer.");
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading />;
  if (!profil) return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-[#10231f]">Profil WiFi introuvable.</main>;

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#10231f]">
      <header className="border-b border-[#dfe5e1] bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102f2a]"><Wifi className="text-[#9ee0d4]" size={24} /></div><div className="leading-tight"><span className="block text-[15px] font-extrabold text-[#112d29]">CyberCanvas</span><span className="block text-xs font-semibold tracking-[0.12em] text-[#59716b]">SERVICES</span></div></Link>
          <div className="hidden items-center gap-2 text-sm font-semibold text-[#59716b] sm:flex"><LockKeyhole size={16} className="text-[#0a6f61]" /> Paiement sécurisé</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:py-12 lg:grid-cols-[1fr_430px] lg:px-8 lg:py-16">
        <section className="flex flex-col justify-center rounded-3xl bg-[#102f2a] p-7 text-white shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9ee0d4]">Accès WiFi sécurisé</p>
          <h1 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-5xl">Achetez votre ticket WiFi en quelques secondes.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75">Choisissez votre réseau de paiement, confirmez sur votre téléphone et recevez automatiquement vos identifiants de connexion.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3"><Feature icon={ShieldCheck} text="Paiement sécurisé" /><Feature icon={Phone} text="Confirmation téléphone" /><Feature icon={CheckCircle2} text="Ticket instantané" /></div>
        </section>

        <section className="rounded-3xl border border-[#dfe5e1] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a7566]">Finaliser l’achat</p><h2 className="mt-2 text-2xl font-extrabold text-[#10231f]">Votre accès WiFi</h2></div>
          <div className="rounded-2xl bg-[#eef2ee] p-5"><p className="text-sm font-semibold text-[#59716b]">Profil sélectionné</p><p className="mt-1 text-xl font-extrabold text-[#173a34]">{profil.nom}</p><div className="mt-4 flex items-end justify-between border-t border-[#d7e2dc] pt-4"><span className="text-sm font-semibold text-[#59716b]">À payer</span><span className="text-3xl font-black text-[#0a6f61]">{profil.prix} <small className="text-base">FCFA</small></span></div></div>
          <div className="mt-6"><label className="mb-2 block text-sm font-bold text-[#173a34]">Numéro Flooz ou TMoney</label><div className="relative"><Phone className="absolute left-4 top-4 text-[#6b817a]" size={20} /><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Ex. 228 92 89 29 661 52" inputMode="tel" disabled={submitting} className="w-full rounded-xl border border-[#cbd9d3] bg-[#f7faf8] px-4 py-3.5 pl-12 text-base outline-none transition focus:border-[#0a806e] focus:ring-2 focus:ring-[#bfe4db]" /></div></div>
          <div className="mt-5"><label className="mb-2 block text-sm font-bold text-[#173a34]">Choisissez votre réseau</label><div className="grid grid-cols-2 gap-3"><NetworkChoice active={network === "TMONEY"} onClick={() => setNetwork("TMONEY")} image="/mixx.png" label="TMoney / Mixx" /><NetworkChoice active={network === "FLOOZ"} onClick={() => setNetwork("FLOOZ")} image="/flooz.png" label="Flooz" /></div></div>
          {message && <div className="mt-5 rounded-xl border border-[#9ed9cc] bg-[#edf9f4] p-4 text-sm font-semibold leading-6 text-[#126353]">{message}</div>}
          <button onClick={() => void payer()} disabled={submitting} className="mt-6 w-full rounded-xl bg-[#0a6f61] py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#075b50] disabled:cursor-wait disabled:opacity-60">{submitting ? "En attente de confirmation..." : "Payer maintenant"}</button>
          <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#6b817a]"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-[#0a806e]" /><span>Après confirmation, vos identifiants WiFi s’afficheront automatiquement.</span></div>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0a6f61] hover:text-[#075b50]"><ArrowLeft size={16} /> Retour à l’accueil</Link>
        </section>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) { return <div className="flex items-center gap-2 text-sm font-semibold text-white/85"><Icon size={18} className="text-[#9ee0d4]" />{text}</div>; }
function NetworkChoice({ active, onClick, image, label }: { active: boolean; onClick: () => void; image: string; label: string }) { return <button type="button" onClick={onClick} className={`rounded-xl border-2 p-2 text-left transition ${active ? "border-[#0a806e] bg-[#edf9f4]" : "border-[#dfe5e1] bg-white hover:border-[#9ed9cc]"}`}><div className="flex h-12 items-center justify-center overflow-hidden rounded-lg bg-white"><Image src={image} alt={label} width={100} height={54} className="h-10 w-auto object-contain" /></div><p className={`mt-2 text-xs font-bold ${active ? "text-[#0a6f61]" : "text-[#59716b]"}`}>{label}</p></button>; }
function PageLoading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-[#59716b]">Chargement...</main>; }