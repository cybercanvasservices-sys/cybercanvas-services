"use client";

import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";

type Profil = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
  slug: string;
};

export default function LiensPage() {
  const [profils, setProfils] = useState<Profil[]>([]);
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin
  );

  useEffect(() => {
    async function chargerProfils() {
      const { data, error } = await supabase
        .from("profils")
        .select("id, nom, prix, duree, slug")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setProfils(data || []);
    }

    void chargerProfils();
  }, []);

  async function copierLien(slug: string) {
    if (!origin) return;
    await navigator.clipboard.writeText(`${origin}/buy/${slug}`);
  }

  return (
    <AdminShell title="Points WiFi" breadcrumb="Points WiFi">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Liens de vente
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Retrouvez les liens publics de chaque offre WiFi pour les partager
              rapidement avec vos clients.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {profils.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              Aucun profil disponible.
            </div>
          ) : (
            profils.map((profil) => {
              const lien = `${origin}/buy/${profil.slug}`;

              return (
                <article
                  key={profil.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {profil.nom}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-cyan-700">
                        {profil.prix} FCFA - {profil.duree}
                      </p>
                      <p className="mt-3 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        {lien}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copierLien(profil.slug)}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 px-4 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50"
                      >
                        <Copy size={16} />
                        Copier
                      </button>
                      <a
                        href={lien}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        <ExternalLink size={16} />
                        Ouvrir
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </AdminShell>
  );
}
