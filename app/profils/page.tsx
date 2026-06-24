"use client";

import { Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";

type Profil = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
  slug: string;
  tickets?: {
    id: number;
    statut: string;
  }[];
};

export default function ProfilsPage() {
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [duree, setDuree] = useState("");
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin
  );
  const [profils, setProfils] = useState<Profil[]>([]);
  const [editingProfil, setEditingProfil] = useState<Profil | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editPrix, setEditPrix] = useState("");
  const [editDuree, setEditDuree] = useState("");
  const [loading, setLoading] = useState(false);

  async function chargerProfils() {
    const { data, error } = await supabase
      .from("profils")
      .select(`
        *,
        tickets (
          id,
          statut
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setProfils(data || []);
  }

  useEffect(() => {
    async function chargerProfilsInitial() {
      const { data, error } = await supabase
        .from("profils")
        .select(`
          *,
          tickets (
            id,
            statut
          )
        `)
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setProfils(data || []);
    }

    void chargerProfilsInitial();
  }, []);

  async function ajouterProfil() {
    if (!nom || !prix || !duree) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      const slug =
        nom.toLowerCase().replace(/\s+/g, "-") +
        "-" +
        Date.now();

      const { error } = await supabase
        .from("profils")
        .insert([
          {
            nom,
            prix: Number(prix),
            duree,
            slug,
          },
        ]);

      if (error) {
        alert(error.message);
        return;
      }

      setNom("");
      setPrix("");
      setDuree("");
      await chargerProfils();
      alert("Profil cree avec succes");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function modifierProfil() {
    if (!editingProfil || !editNom || !editPrix || !editDuree) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profils")
      .update({
        nom: editNom,
        prix: Number(editPrix),
        duree: editDuree,
      })
      .eq("id", editingProfil.id)
      .select(`
        *,
        tickets (
          id,
          statut
        )
      `)
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setProfils((current) =>
      current.map((profil) =>
        profil.id === editingProfil.id ? data : profil
      )
    );
    setEditingProfil(null);
    setEditNom("");
    setEditPrix("");
    setEditDuree("");
    setLoading(false);
  }

  async function supprimerProfil(profil: Profil) {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer "${profil.nom}" et ses tickets ?`
    );

    if (!confirmation) return;

    setLoading(true);

    const { error: ticketsError } = await supabase
      .from("tickets")
      .delete()
      .eq("profil_id", profil.id);

    if (ticketsError) {
      alert(ticketsError.message);
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profils")
      .delete()
      .eq("id", profil.id);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setProfils((current) =>
      current.filter((item) => item.id !== profil.id)
    );
    setLoading(false);
  }

  async function copierLien(slug: string) {
    await navigator.clipboard.writeText(`${origin}/buy/${slug}`);
    window.alert("Lien de paiement copie.");
  }

  return (
    <AdminShell title="Profils WiFi" breadcrumb="Profils">
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Nouveau profil
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Cree une offre vendable par lien public.
          </p>

          <div className="mt-5 grid gap-4">
            <input
              value={nom}
              onChange={(e) =>
                setNom(e.target.value)
              }
              placeholder="Nom du profil"
              className="rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
            />

            <input
              value={prix}
              onChange={(e) =>
                setPrix(e.target.value)
              }
              placeholder="Prix"
              type="number"
              className="rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
            />

            <input
              value={duree}
              onChange={(e) =>
                setDuree(e.target.value)
              }
              placeholder="Duree, ex: 1 heure"
              className="rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={ajouterProfil}
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading
              ? "Creation..."
              : "Creer le profil"}
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Profils crees
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Import CSV attendu: username,password
              </p>
            </div>
          </div>

          {profils.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Aucun profil cree.
            </div>
          ) : (
            <div className="grid gap-4">
              {profils.map((profil) => {
                const lienPaiement = `${origin}/buy/${profil.slug}`;
                const disponibles =
                  profil.tickets?.filter(
                    (ticket) => ticket.statut === "disponible"
                  ).length || 0;
                const vendus =
                  profil.tickets?.filter(
                    (ticket) => ticket.statut === "vendu"
                  ).length || 0;

                return (
                  <article
                    key={profil.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {profil.nom}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {profil.duree} - {profil.prix} FCFA
                        </p>
                        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center">
                          <p className="min-w-0 flex-1 break-all text-sm text-cyan-700">
                            {lienPaiement}
                          </p>
                          <button
                            type="button"
                            onClick={() => copierLien(profil.slug)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-200 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50"
                          >
                            <Copy size={16} />
                            Copier
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <Badge label="Disponibles" value={disponibles} />
                        <Badge label="Vendus" value={vendus} />
                        <Badge
                          label="Revenus"
                          value={`${vendus * profil.prix} F`}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfil(profil);
                            setEditNom(profil.nom);
                            setEditPrix(String(profil.prix));
                            setEditDuree(profil.duree);
                          }}
                          className="rounded bg-indigo-500 px-4 py-2 text-sm font-black text-white hover:bg-indigo-600"
                          title="Modifier le groupe"
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => supprimerProfil(profil)}
                          className="rounded bg-emerald-500 px-4 py-2 text-sm font-black text-white hover:bg-emerald-600"
                          title="Supprimer le groupe"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {editingProfil && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-4">
          <div className="flex max-h-[calc(100vh-32px)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Modification : Groupe
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Modifiez les informations du groupe WiFi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfil(null)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="block text-sm font-bold text-slate-700">
                Nom du groupe
                <input
                  value={editNom}
                  onChange={(event) => setEditNom(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Prix
                <input
                  value={editPrix}
                  onChange={(event) => setEditPrix(event.target.value)}
                  type="number"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Duree
                <input
                  value={editDuree}
                  onChange={(event) => setEditDuree(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
                />
              </label>
            </div>

            <div className="flex shrink-0 justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingProfil(null)}
                className="rounded-lg bg-slate-500 px-5 py-3 text-sm font-bold text-white hover:bg-slate-600"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={modifierProfil}
                disabled={loading}
                className="rounded-lg border border-indigo-500 px-8 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Modification..." : "Modifier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Badge({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}
