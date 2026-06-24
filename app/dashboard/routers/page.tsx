"use client";

import { Copy, ExternalLink, Plus, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";

type RouterRow = {
  id: string | number;
  nom: string;
  description?: string | null;
  systeme?: string | null;
  dns_name?: string | null;
  adresse?: string | null;
  token: string | null;
  statut: string | null;
  credits: number | null;
  created_at: string | null;
};

type ProfilRow = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
  slug: string;
};

export default function RoutersPage() {
  const [routeurs, setRouteurs] = useState<RouterRow[]>([]);
  const [profils, setProfils] = useState<ProfilRow[]>([]);
  const [search, setSearch] = useState("");
  const [profilSearch, setProfilSearch] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [systeme, setSysteme] = useState("MIKROTIK");
  const [dnsName, setDnsName] = useState("");
  const [adresse, setAdresse] = useState("");
  const [editingRouteur, setEditingRouteur] = useState<RouterRow | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSysteme, setEditSysteme] = useState("MIKROTIK");
  const [editDnsName, setEditDnsName] = useState("");
  const [editAdresse, setEditAdresse] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilsLoading, setProfilsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin
  );

  useEffect(() => {
    let active = true;

    fetch("/api/routers")
      .then((response) => response.json())
      .then((result) => {
        if (!active) return;

        setRouteurs(result.routeurs || []);
        setLoading(false);
      })
      .catch((loadError) => {
        if (!active) return;
        console.error(loadError);
        setError("Impossible de charger les routeurs.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/profils")
      .then((response) => response.json())
      .then((result) => {
        if (!active) return;

        setProfils(result.profils || []);
        setProfilsLoading(false);
      })
      .catch((loadError) => {
        if (!active) return;
        console.error(loadError);
        setProfilsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function ajouterRouteur(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!nom.trim() || !description.trim() || !adresse.trim()) {
      setError("Remplissez le libelle, la description et l'adresse.");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/routers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nom: nom.trim(),
        description: description.trim(),
        systeme,
        dns_name: dnsName.trim() || "wifi.cybercanvas.local",
        adresse: adresse.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.message || "Erreur lors de l'ajout du routeur.");
      setSaving(false);
      return;
    }

    setRouteurs((current) => [result.routeur, ...current]);
    setNom("");
    setDescription("");
    setSysteme("MIKROTIK");
    setDnsName("");
    setAdresse("");
    setModalOpen(false);
    setSaving(false);
  }

  async function modifierRouteur(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!editingRouteur || !editNom.trim()) {
      setError("Entrez le nouveau libelle du routeur.");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/routers", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: editingRouteur.id,
        nom: editNom.trim(),
        description: editDescription.trim(),
        systeme: editSysteme,
        dns_name: editDnsName.trim() || "wifi.cybercanvas.local",
        adresse: editAdresse.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.message || "Modification impossible.");
      setSaving(false);
      return;
    }

    setRouteurs((current) =>
      current.map((routeur) =>
        routeur.id === editingRouteur.id ? result.routeur : routeur
      )
    );
    setEditingRouteur(null);
    setEditNom("");
    setSaving(false);
  }

  async function copierToken(routeur: RouterRow) {
    await navigator.clipboard.writeText(routeur.token || "");
    window.alert("Code du routeur copie.");
  }

  async function copierLienPaiement(slug: string) {
    const link = `${origin}/buy/${slug}`;
    await navigator.clipboard.writeText(link);
    window.alert("Lien de paiement copie.");
  }

  async function supprimerRouteur(id: string | number) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer ce routeur ?"
    );

    if (!confirmation) return;

    const response = await fetch("/api/routers", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const result = await response.json();
      setError(result.message || "Suppression impossible pour ce routeur.");
      return;
    }

    setRouteurs((current) =>
      current.filter((routeur) => routeur.id !== id)
    );
  }

  const routeursFiltres = useMemo(() => {
    const query = search.toLowerCase();

    return routeurs.filter((routeur) =>
      [
        routeur.nom,
        routeur.description,
        routeur.adresse,
        routeur.systeme,
        routeur.dns_name,
        routeur.token,
        routeur.statut,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [routeurs, search]);

  const online = routeurs.filter((routeur) => routeur.statut === "online").length;
  const offline = routeurs.length - online;
  const credits = routeurs.reduce(
    (total, routeur) => total + (routeur.credits || 0),
    0
  );

  const profilsFiltres = useMemo(() => {
    const query = profilSearch.trim().toLowerCase();

    if (!query) return profils;

    return profils.filter((profil) =>
      [profil.nom, profil.prix, profil.duree, profil.slug]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [profilSearch, profils]);

  return (
    <AdminShell title="Mes Routeurs" breadcrumb="Offres WiFi / Routeurs">
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Stat label="Total routeurs" value={routeurs.length} />
        <Stat label="Connectes" value={online} tone="text-emerald-600" />
        <Stat label="Hors ligne" value={offline} tone="text-slate-600" />
        <Stat label="Credits disponibles" value={credits} tone="text-amber-600" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                Liste : <span className="font-semibold">Mes Routeurs</span>
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Frais de service : 10%. Retrait min. 5000. SMS : 15F/envoi.
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Utilisez <Badge label="U" /> pour les modifications,{" "}
              <Badge label="X" /> pour les suppressions et{" "}
              <Badge label="//" /> pour les codes SMS.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-900 px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-900 hover:text-white"
          >
            <Plus size={17} />
            Nouveau Routeur
          </button>
        </div>

        <div className="flex justify-center py-6">
          <label className="text-sm font-medium text-slate-500">
            Recherche :
            <span className="mt-2 flex w-64 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 focus-within:border-cyan-500">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-slate-800 outline-none"
              />
            </span>
          </label>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-left text-slate-600">
                <th className="w-[12%] px-2 py-3">Date</th>
                <th className="w-[22%] px-2 py-3">Libelle</th>
                <th className="w-[17%] px-2 py-3">Description</th>
                <th className="w-[17%] px-2 py-3">Adresse</th>
                <th className="w-[9%] px-2 py-3">Systeme</th>
                <th className="w-[9%] px-2 py-3">DNS</th>
                <th className="w-[14%] px-2 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Chargement des routeurs...
                  </td>
                </tr>
              ) : routeursFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Aucun routeur trouve.
                  </td>
                </tr>
              ) : (
                routeursFiltres.map((routeur) => (
                  <tr
                    key={routeur.id}
                    className="border-b border-slate-100 text-slate-700 hover:bg-cyan-50/40"
                  >
                    <td className="px-2 py-4 text-xs leading-5">
                      {routeur.created_at
                        ? new Date(routeur.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-2 py-4 font-bold leading-6 text-slate-900">
                      <span className="block truncate" title={routeur.nom}>
                        {routeur.nom}
                      </span>
                    </td>
                    <td className="px-2 py-4 leading-6">
                      <span
                        className="block truncate"
                        title={routeur.description || "Point WiFi MikroTik"}
                      >
                        {routeur.description || "Point WiFi MikroTik"}
                      </span>
                    </td>
                    <td className="px-2 py-4 leading-6">
                      <span
                        className="block truncate"
                        title={routeur.adresse || routeur.token || "-"}
                      >
                        {routeur.adresse || routeur.token || "-"}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span className="block truncate" title={routeur.systeme || "MIKROTIK"}>
                        {routeur.systeme || "MIKROTIK"}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span
                        className="block truncate"
                        title={routeur.dns_name || "wifi.cybercanvas.local"}
                      >
                        {routeur.dns_name || "wifi.cybercanvas.local"}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex flex-wrap justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRouteur(routeur);
                            setEditNom(routeur.nom);
                            setEditDescription(
                              routeur.description || "Point WiFi MikroTik"
                            );
                            setEditSysteme(routeur.systeme || "MIKROTIK");
                            setEditDnsName(
                              routeur.dns_name || "wifi.cybercanvas.local"
                            );
                            setEditAdresse(routeur.adresse || routeur.token || "");
                            setError("");
                          }}
                          className="rounded bg-indigo-500 px-2 py-1.5 text-xs font-black text-white"
                          title="Modifier le routeur"
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => copierToken(routeur)}
                          className="rounded bg-cyan-500 px-2 py-1.5 text-xs font-black text-white"
                          title="Code SMS"
                        >
                          {"//"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copierToken(routeur)}
                          className="rounded bg-red-500 px-2 py-1.5 text-xs font-black text-white"
                          title="SMS"
                        >
                          SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => supprimerRouteur(routeur.id)}
                          className="rounded bg-emerald-500 px-2 py-1.5 text-xs font-black text-white"
                          title="Supprimer"
                        >
                          X
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Affichage de {routeursFiltres.length} entree(s) sur {routeurs.length}.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Liens portail captif
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Chaque groupe/profil genere un lien de paiement. Collez ce lien
              sur la page de votre portail captif du routeur MikroTik: au clic,
              le client est redirige vers la page de paiement.
            </p>
          </div>

          <label className="text-sm font-medium text-slate-500">
            Recherche :
            <span className="mt-2 flex w-64 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 focus-within:border-cyan-500">
              <Search size={16} className="text-slate-400" />
              <input
                value={profilSearch}
                onChange={(event) => setProfilSearch(event.target.value)}
                className="w-full bg-transparent text-slate-800 outline-none"
              />
            </span>
          </label>
        </div>

        <div className="mt-5 grid gap-3">
          {profilsLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              Chargement des liens...
            </div>
          ) : profilsFiltres.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              Aucun groupe disponible. Creez un groupe dans Mes Groupes.
            </div>
          ) : (
            profilsFiltres.map((profil) => {
              const lienPaiement = `${origin}/buy/${profil.slug}`;

              return (
                <article
                  key={profil.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900">
                        {profil.nom}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-cyan-700">
                        {profil.duree} - {profil.prix} FCFA
                      </p>
                      <p className="mt-3 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        {lienPaiement}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copierLienPaiement(profil.slug)}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 px-4 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50"
                      >
                        <Copy size={16} />
                        Copier
                      </button>
                      <a
                        href={lienPaiement}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        <ExternalLink size={16} />
                        Tester
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-4">
          <form
            onSubmit={ajouterRouteur}
            className="flex max-h-[calc(100vh-32px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Creation : Routeur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="block text-sm font-bold text-slate-700">
                Libelle
                <input
                  value={nom}
                  onChange={(event) => setNom(event.target.value)}
                  placeholder="Entrer le libelle"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Entrer la description"
                  className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Systeme de gestion
                <select
                  value={systeme}
                  onChange={(event) => setSysteme(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                >
                  <option value="MIKROTIK">MIKROTIK</option>
                  <option value="UNIFI">UNIFI</option>
                  <option value="OPENWRT">OPENWRT</option>
                  <option value="AUTRE">AUTRE</option>
                </select>
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                DNS name
                <input
                  value={dnsName}
                  onChange={(event) => setDnsName(event.target.value)}
                  placeholder="Entrer le dns_name"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Adresse
                <textarea
                  value={adresse}
                  onChange={(event) => setAdresse(event.target.value)}
                  placeholder="Entrer la adresse"
                  className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg bg-slate-500 px-5 py-3 text-sm font-bold text-white hover:bg-slate-600"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg border border-indigo-500 px-8 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creation..." : "Creer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingRouteur && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 px-4 py-4">
          <form
            onSubmit={modifierRouteur}
            className="flex max-h-[calc(100vh-32px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Modification : Routeur
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Modifiez les informations du routeur selectionne.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRouteur(null)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="block text-sm font-bold text-slate-700">
                Libelle
                <input
                  value={editNom}
                  onChange={(event) => setEditNom(event.target.value)}
                  placeholder="Entrer le libelle"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Description
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder="Entrer la description"
                  className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Systeme de gestion
                <select
                  value={editSysteme}
                  onChange={(event) => setEditSysteme(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                >
                  <option value="MIKROTIK">MIKROTIK</option>
                  <option value="UNIFI">UNIFI</option>
                  <option value="OPENWRT">OPENWRT</option>
                  <option value="AUTRE">AUTRE</option>
                </select>
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                DNS name
                <input
                  value={editDnsName}
                  onChange={(event) => setEditDnsName(event.target.value)}
                  placeholder="Entrer le dns_name"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-slate-700">
                Adresse
                <textarea
                  value={editAdresse}
                  onChange={(event) => setEditAdresse(event.target.value)}
                  placeholder="Entrer la adresse"
                  className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
                />
              </label>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingRouteur(null)}
                className="rounded-lg bg-slate-500 px-5 py-3 text-sm font-bold text-white hover:bg-slate-600"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg border border-indigo-500 px-8 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Modification..." : "Modifier"}
              </button>
            </div>
          </form>
        </div>
      )}

    </AdminShell>
  );
}

function Stat({
  label,
  value,
  tone = "text-slate-900",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-black ${tone}`}>{value}</h3>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-1 font-bold text-rose-500">
      {label}
    </span>
  );
}


