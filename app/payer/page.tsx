"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Ticket = {
  id: number;
  username: string;
  password: string;
  profil_id: number;
};

type ConfirmResponse = {
  success: boolean;
  message?: string;
  ticket?: Ticket;
};

export default function PayerPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PayerContent />
    </Suspense>
  );
}

function PayerContent() {
  const searchParams = useSearchParams();
  const profilId = searchParams?.get("profil") || null;
  const identifier = searchParams?.get("identifier") || null;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verification du paiement...");

  useEffect(() => {
    async function verifierPaiement() {
      try {
        if (!profilId || !identifier) {
          setMessage("Informations de paiement manquantes");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/paygate/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profilId,
            identifier,
          }),
        });

        const resultat = (await response.json()) as ConfirmResponse;

        if (!response.ok || !resultat.success || !resultat.ticket) {
          setMessage(resultat.message || "Paiement non confirme");
          setLoading(false);
          return;
        }

        setTicket(resultat.ticket);
        setMessage(resultat.message || "Paiement valide avec succes");
      } catch {
        setMessage("Erreur lors de la verification");
      }

      setLoading(false);
    }

    void verifierPaiement();
  }, [identifier, profilId]);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          CyberCanvas Services
        </p>
        <h1 className="mb-6 text-4xl font-bold">Ticket WiFi</h1>

        {loading && <div className="rounded-xl bg-slate-800 p-4">{message}</div>}

        {!loading && !ticket && (
          <div className="rounded-xl bg-red-950 p-4 text-red-100">{message}</div>
        )}

        {!loading && ticket && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-950 p-4 text-emerald-100">
              {message}
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-slate-400">Identifiant</p>
              <p className="text-2xl font-bold">{ticket.username}</p>
            </div>

            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-slate-400">Mot de passe</p>
              <p className="text-2xl font-bold">{ticket.password}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function PageLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-slate-900 p-8">
        Chargement...
      </div>
    </main>
  );
}

