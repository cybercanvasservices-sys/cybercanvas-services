"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Copy, LockKeyhole, ShieldCheck, Wifi, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

type Ticket = { id: number; username: string; password: string; profil_id: number };
type ConfirmResponse = { success: boolean; message?: string; ticket?: Ticket };

export default function PayerPage() {
  return <Suspense fallback={<PageLoading />}><PayerContent /></Suspense>;
}

function PayerContent() {
  const params = useSearchParams();
  const profilId = params.get("profil");
  const identifier = params.get("identifier");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Vérification du paiement...");

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        if (!profilId || !identifier) { setMessage("Les informations de paiement sont manquantes."); setLoading(false); return; }
        let result: ConfirmResponse | null = null;
        for (let attempt = 0; attempt < 10; attempt += 1) {
          const response = await fetch("/api/paygate/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profilId, identifier }), cache: "no-store" });
          result = (await response.json()) as ConfirmResponse;
          if (response.ok && result.success && result.ticket) break;
          if (attempt < 9) { setMessage("Paiement en cours de confirmation..."); await new Promise((resolve) => setTimeout(resolve, 3000)); }
        }
        if (cancelled) return;
        if (!result?.success || !result.ticket) { setMessage(result?.message || "Paiement non confirmé."); setLoading(false); return; }
        setTicket(result.ticket); setMessage(result.message || "Paiement confirmé avec succès.");
      } catch { if (!cancelled) setMessage("Une erreur est survenue pendant la vérification."); }
      if (!cancelled) setLoading(false);
    }
    void verify();
    return () => { cancelled = true; };
  }, [identifier, profilId]);

  const success = !loading && Boolean(ticket);
  const failed = !loading && !ticket;
  return <main className="min-h-screen bg-[#f7f8f6] text-[#10231f]">
    <header className="border-b border-[#dfe5e1] bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"><Link href="/" className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102f2a]"><Wifi className="text-[#9ee0d4]" size={24} /></div><div className="leading-tight"><span className="block text-[15px] font-extrabold text-[#112d29]">CyberCanvas</span><span className="block text-xs font-semibold tracking-[0.12em] text-[#59716b]">SERVICES</span></div></Link><div className="hidden items-center gap-2 text-sm font-semibold text-[#59716b] sm:flex"><LockKeyhole size={16} className="text-[#0a6f61]" /> Paiement sécurisé</div></div></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:py-12 lg:grid-cols-[1fr_520px] lg:px-8 lg:py-16">
      <section className="flex flex-col justify-center rounded-3xl bg-[#102f2a] p-7 text-white shadow-sm sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9ee0d4]">Accès WiFi sécurisé</p><h1 className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-5xl">Votre ticket WiFi arrive.</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/75">Nous vérifions votre paiement auprès de l’opérateur. Cette page se met à jour automatiquement dès que la confirmation est reçue.</p><div className="mt-8 space-y-4"><Step done={success} active={!success && !failed} number="1" title="Paiement reçu" /><Step done={success} active={loading} number="2" title="Confirmation en cours" /><Step done={success} active={success} number="3" title="Ticket WiFi affiché" /></div></section>
      <section className="rounded-3xl border border-[#dfe5e1] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0a7566]">Ticket WiFi</p><h2 className="mt-2 text-2xl font-extrabold text-[#10231f]">{success ? "Paiement confirmé" : failed ? "Vérification terminée" : "Paiement en cours de confirmation"}</h2></div><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${success ? "bg-[#edf9f4] text-[#0a806e]" : failed ? "bg-red-50 text-red-600" : "bg-[#fff7e8] text-[#d68b16]"}`}>{success ? <CheckCircle2 size={25} /> : failed ? <XCircle size={25} /> : <Clock3 className="animate-pulse" size={25} />}</div></div>
        {loading && <div className="mt-8 rounded-2xl border border-[#f1dfb8] bg-[#fffaf0] p-5"><div className="flex items-center gap-3 text-sm font-bold text-[#8c641c]"><Clock3 size={20} /> {message}</div><p className="mt-3 text-sm leading-6 text-[#806f4e]">Veuillez patienter quelques instants. Ne fermez pas cette page.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#f2e6ca]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#e5ae42]" /></div></div>}
        {failed && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800"><div className="flex items-center gap-3 font-bold"><XCircle size={20} /> {message}</div><p className="mt-3">Si vous avez bien confirmé le paiement, actualisez cette page dans quelques secondes ou contactez-nous.</p></div>}
        {success && ticket && <div className="mt-8 space-y-4"><div className="rounded-2xl border border-[#9ed9cc] bg-[#edf9f4] p-5 text-center"><div className="flex justify-center text-[#0a806e]"><CheckCircle2 size={28} /></div><p className="mt-2 text-lg font-extrabold text-[#126353]">Voici le code de votre ticket WiFi</p><p className="mt-2 text-sm leading-6 text-[#39766b]">Veuillez prendre note de ces informations ou faire une capture d’écran avant de fermer cette page.</p></div><Credential label="Identifiant" value={ticket.username} /><Credential label="Mot de passe" value={ticket.password} /></div>}
        <div className="mt-8 flex items-start gap-2 text-xs leading-5 text-[#6b817a]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#0a806e]" /><span>Vos informations sont affichées de manière sécurisée sur cette page.</span></div><Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#0a6f61] hover:text-[#075b50]"><ArrowLeft size={16} /> Retour à l’accueil</Link>
      </section>
    </div>
  </main>;
}

function Step({ active, done, number, title }: { active: boolean; done: boolean; number: string; title: string }) { return <div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-extrabold ${done ? "border-[#9ee0d4] bg-[#9ee0d4] text-[#102f2a]" : active ? "border-[#9ee0d4] text-[#9ee0d4]" : "border-white/25 text-white/45"}`}>{done ? "✓" : number}</div><span className={`text-sm font-semibold ${active || done ? "text-white" : "text-white/45"}`}>{title}</span></div>; }
function Credential({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#dfe5e1] bg-[#f7faf8] p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#59716b]">{label}</p><button type="button" onClick={() => void navigator.clipboard?.writeText(value)} className="inline-flex items-center gap-1 text-xs font-bold text-[#0a6f61] hover:text-[#075b50]"><Copy size={14} /> Copier</button></div><p className="mt-3 break-all text-center text-3xl font-black tracking-[0.12em] text-[#102f2a] sm:text-4xl">{value}</p></div>; }
function PageLoading() { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] text-[#59716b]"><div className="rounded-2xl border border-[#dfe5e1] bg-white px-8 py-6 text-sm font-semibold shadow-sm">Chargement de votre paiement...</div></main>; }
