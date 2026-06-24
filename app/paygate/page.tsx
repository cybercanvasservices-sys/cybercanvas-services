"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profil = {
  id: number;
  nom: string;
  prix: number;
  slug: string;
};

export default function PaygatePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaygateContent />
    </Suspense>
  );
}

function PaygateContent() {
  const searchParams = useSearchParams();
  const profilId = searchParams.get("profil");
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function chargerProfil() {
      try {
        if (!profilId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profils")
          .select("id, nom, prix, slug")
          .eq("id", Number(profilId))
          .single<Profil>();

        if (!error) {
          setProfil(data);
        }
      } finally {
        setLoading(false);
      }
    }

    chargerProfil();
  }, [profilId]);

  function payer() {
    if (!profil?.slug) return;
    window.location.href = `/buy/${profil.slug}`;
  }

  if (loading) {
    return <PageLoading />;
  }

  if (!profil) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Profil introuvable
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-2xl bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          CyberCanvas Services
        </p>
        <h1 className="mb-6 text-4xl font-bold">Paiement securise</h1>

        <div className="mb-4 rounded-xl bg-slate-800 p-4">
          <p className="text-slate-400">Profil WiFi</p>
          <p className="text-xl font-bold">{profil.nom}</p>
        </div>

        <div className="mb-6 rounded-xl bg-slate-800 p-4">
          <p className="text-slate-400">Montant</p>
          <p className="text-2xl font-bold text-cyan-300">{profil.prix} FCFA</p>
        </div>

        <button
          onClick={payer}
          className="w-full rounded-xl bg-cyan-500 py-4 font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          Acheter maintenant
        </button>
      </div>
    </main>
  );
}

function PageLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      Chargement...
    </main>
  );
}
