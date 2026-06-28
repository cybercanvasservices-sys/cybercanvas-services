"use client";

import { Search, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";

type Profil = {
  id: number;
  nom: string;
  prix: number;
  duree: string;
};

type Ticket = {
  id: number;
  username: string;
  password: string;
  statut: string;
  profils: Profil | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erreur lors du chargement";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profils, setProfils] = useState<Profil[]>([]);
  const [search, setSearch] = useState("");
  const [profilFilter, setProfilFilter] = useState("all");
  const [selectedProfilId, setSelectedProfilId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function chargerTickets() {
    try {
      setLoading(true);
      const response = await fetch("/api/tickets", { cache: "no-store" });
      const result = (await response.json()) as {
        tickets?: Ticket[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors du chargement");
      }

      setTickets(result.tickets || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const { data: profilsData, error: profilsError } = await supabase
          .from("profils")
          .select("id, nom, prix, duree")
          .order("id", { ascending: false });

        if (profilsError) throw profilsError;
        setProfils(profilsData || []);
      } catch (err) {
        setError(getErrorMessage(err));
      }

      await chargerTickets();
    }

    void chargerDonnees();
  }, []);

  async function uploaderTickets() {
    setError("");

    if (!selectedProfilId) {
      setError("Selectionnez un groupe/profil avant l'importation.");
      return;
    }

    if (!csvFile) {
      setError("Choisissez un fichier CSV.");
      return;
    }

    setUploading(true);

    try {
      const contenu = await csvFile.text();
      const lignes = contenu
        .split(/\r?\n/)
        .filter((ligne) => ligne.trim() !== "");

      if (lignes.length <= 1) {
        setError("CSV vide. Format attendu: username,password");
        setUploading(false);
        return;
      }

      const ticketsImportes = lignes
        .slice(1)
        .map((ligne) => {
          const [username, password] = ligne.split(",");

          return {
            profil_id: Number(selectedProfilId),
            username: username?.trim(),
            password: password?.trim(),
            statut: "disponible",
          };
        })
        .filter((ticket) => ticket.username && ticket.password);

      if (ticketsImportes.length === 0) {
        setError("Aucun ticket valide trouve dans le CSV.");
        setUploading(false);
        return;
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profil_id: Number(selectedProfilId),
          tickets: ticketsImportes.map((ticket) => ({
            username: ticket.username,
            password: ticket.password,
          })),
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        count?: number;
      };

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'importation");
      }

      setCsvFile(null);
      await chargerTickets();
      window.alert(result.message || `${ticketsImportes.length} tickets importes avec succes`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const ticketsFiltres = useMemo(() => {
    const query = search.trim().toLowerCase();
    const ticketsParProfil =
      profilFilter === "all"
        ? tickets
        : tickets.filter(
            (ticket) => String(ticket.profils?.id) === profilFilter
          );

    if (!query) return ticketsParProfil;

    return ticketsParProfil.filter((ticket) =>
      [
        ticket.username,
        ticket.password,
        ticket.statut,
        ticket.profils?.nom,
        ticket.profils?.prix,
        ticket.profils?.duree,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [profilFilter, tickets, search]);

  return (
    <AdminShell title="Mes Tickets" breadcrumb="Offres WiFi / Tickets">
      <h1 className="mb-6 text-2xl font-black text-slate-900">
        Tickets
      </h1>

      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-3">
            <label className="block text-sm font-bold text-slate-700">
              Afficher les tickets du profil
              <select
                value={profilFilter}
                onChange={(event) => setProfilFilter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500"
              >
                <option value="all">Tout</option>
                {profils.map((profil) => (
                  <option key={profil.id} value={profil.id}>
                    {profil.nom} - {profil.duree}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Rechercher dans la selection
              <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-cyan-500">
                <Search size={18} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Identifiant, mot de passe, profil, statut..."
                  className="w-full bg-transparent py-1 text-slate-900 outline-none"
                />
              </span>
            </label>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700">
              Importer des tickets pour un groupe
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <select
                value={selectedProfilId}
                onChange={(event) => setSelectedProfilId(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500"
              >
                <option value="">Choisir un groupe</option>
                {profils.map((profil) => (
                  <option key={profil.id} value={profil.id}>
                    {profil.nom} - {profil.duree}
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept=".csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={uploaderTickets}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={17} />
                {uploading ? "Importation..." : "Importer"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-xl bg-white p-6 text-slate-500 shadow-sm">
          Chargement...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
          Aucun ticket trouve.
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">
            Affichage de {ticketsFiltres.length} ticket(s) sur {tickets.length}
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-4 text-left">Identifiant</th>
                <th className="p-4 text-left">Mot de passe</th>
                <th className="p-4 text-left">Profil</th>
                <th className="p-4 text-left">Prix</th>
                <th className="p-4 text-left">Duree</th>
                <th className="p-4 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ticketsFiltres.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500"
                  >
                    Aucun ticket ne correspond a la recherche.
                  </td>
                </tr>
              ) : (
                ticketsFiltres.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-t border-slate-100 text-slate-700 hover:bg-slate-50"
                >
                  <td className="p-4">{ticket.username}</td>
                  <td className="p-4">{ticket.password}</td>
                  <td className="p-4">{ticket.profils?.nom ?? "-"}</td>
                  <td className="p-4">
                    {ticket.profils?.prix
                      ? `${ticket.profils.prix} FCFA`
                      : "-"}
                  </td>
                  <td className="p-4">{ticket.profils?.duree ?? "-"}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${
                        ticket.statut === "disponible"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {ticket.statut}
                    </span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}


