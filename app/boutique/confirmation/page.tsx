"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle, XCircle } from "lucide-react";

export default function ConfirmationPage() { return <Suspense fallback={<Confirmation status="loading" message="Vérification du paiement..." />}><ConfirmationContent /></Suspense>; }

function ConfirmationContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Vérification du paiement...");
  useEffect(() => {
    fetch("/api/boutique/paiement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commande: params?.get("commande"), identifier: params?.get("identifier") }) })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => { setStatus(ok && data.success ? "success" : "error"); setMessage(data.message || (ok ? "Paiement confirmé." : "Paiement non confirmé.")); })
      .catch(() => { setStatus("error"); setMessage("Impossible de vérifier le paiement pour le moment."); });
  }, [params]);
  return <Confirmation status={status} message={message} />;
}

function Confirmation({ status, message }: { status: "loading" | "success" | "error"; message: string }) {
  const whatsapp = "https://wa.me/22870693326?text=Bonjour%20CyberCanvas%20Services%2C%20je%20souhaite%20confirmer%20la%20livraison%20de%20ma%20commande.";
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f7f5] p-4"><section className="w-full max-w-md rounded-xl border border-[#dfe5e1] bg-white p-8 text-center shadow-xl"><div className="mb-6 flex items-center justify-center gap-3 border-b border-slate-200 pb-5 text-left"><BrandLogo size={42} /><div><p className="font-bold">CyberCanvas Services</p><p className="text-xs text-slate-500">Commande boutique</p></div></div><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${status === "success" ? "bg-emerald-100 text-emerald-700" : status === "error" ? "bg-red-100 text-red-700" : "bg-[#dcebe6] text-[#0a7566]"}`}>{status === "loading" ? <Loader2 className="animate-spin" /> : status === "success" ? <CheckCircle2 /> : <XCircle />}</div><h1 className="mt-5 text-2xl font-extrabold">{status === "success" ? "Commande payée" : status === "error" ? "Paiement en attente" : "Vérification"}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>{status === "success" && <a href={whatsapp} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a6f61] py-3 font-bold text-white"><MessageCircle size={18} /> Confirmer la livraison sur WhatsApp</a>}<Link href="/boutique" className="mt-3 block w-full rounded-lg border border-slate-300 py-3 font-bold text-slate-700">Retour à la boutique</Link></section></main>;
}
