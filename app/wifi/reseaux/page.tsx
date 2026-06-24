"use client";

import { useEffect, useState } from "react";

interface Reseau {
  id: number;
  nom: string;
  description: string;
  dns: string;
}

export default function ReseauxPage() {
  const [showModal, setShowModal] = useState(false);
  const [recherche, setRecherche] = useState("");

  const [reseaux, setReseaux] = useState<Reseau[]>(() => {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem("cybercanvas_reseaux");

    return data ? JSON.parse(data) : [];
  });

  const [form, setForm] = useState({
    nom: "",
    description: "",
    dns: "",
  });

  useEffect(() => {
    localStorage.setItem(
      "cybercanvas_reseaux",
      JSON.stringify(reseaux)
    );
  }, [reseaux]);

  const ajouterReseau = () => {
    if (!form.nom.trim()) return;

    const nouveauReseau: Reseau = {
      id: Date.now(),
      nom: form.nom,
      description: form.description,
      dns: form.dns,
    };

    setReseaux([...reseaux, nouveauReseau]);

    setForm({
      nom: "",
      description: "",
      dns: "",
    });

    setShowModal(false);
  };

  const supprimerReseau = (id: number) => {
    if (!confirm("Supprimer ce réseau ?")) return;

    setReseaux(reseaux.filter((r) => r.id !== id));
  };

  const reseauxFiltres = reseaux.filter((r) =>
    r.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <main className="min-h-screen p-8 text-white">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            📡 Mes Réseaux
          </h1>

          <p className="text-slate-400 mt-2">
            Gérez vos réseaux WiFi.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 px-5 py-3 rounded-xl hover:bg-cyan-500"
        >
          ➕ Nouveau Réseau
        </button>

      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full glass p-4 rounded-xl outline-none"
        />
      </div>

      {reseauxFiltres.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">

          <div className="text-6xl mb-4">
            📡
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Aucun réseau
          </h2>

          <p className="text-slate-400">
            Cliquez sur &quot;Nouveau Réseau&quot; pour commencer.
          </p>

        </div>
      ) : (
        <div className="glass rounded-3xl overflow-hidden">

          <table className="w-full">

            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-left">Nom</th>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-left">DNS WiFi</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>

              {reseauxFiltres.map((reseau) => (
                <tr
                  key={reseau.id}
                  className="border-b border-white/5"
                >
                  <td className="p-4">
                    {reseau.nom}
                  </td>

                  <td className="p-4">
                    {reseau.description}
                  </td>

                  <td className="p-4">
                    {reseau.dns}
                  </td>

                  <td className="p-4 text-center">

                    <button
                      onClick={() =>
                        supprimerReseau(reseau.id)
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      🗑️ Supprimer
                    </button>

                  </td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="glass w-full max-w-xl p-8 rounded-3xl">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-2xl font-bold">
                📡 Nouveau Réseau
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-red-400 text-xl"
              >
                ✕
              </button>

            </div>

            <div className="grid gap-4">

              <input
                type="text"
                placeholder="Nom du réseau"
                value={form.nom}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nom: e.target.value,
                  })
                }
                className="glass p-3 rounded-xl outline-none"
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="glass p-3 rounded-xl outline-none"
              />

              <input
                type="text"
                placeholder="DNS WiFi (optionnel)"
                value={form.dns}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dns: e.target.value,
                  })
                }
                className="glass p-3 rounded-xl outline-none"
              />

              <div className="flex gap-3 mt-4">

                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 p-3 rounded-xl"
                >
                  Annuler
                </button>

                <button
                  onClick={ajouterReseau}
                  className="flex-1 bg-cyan-600 p-3 rounded-xl"
                >
                  Enregistrer
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}


