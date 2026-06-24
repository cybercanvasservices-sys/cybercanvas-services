"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";

export default function NewRouterPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ajouterRouteur(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!nom.trim()) {
      setError("Entrez le nom du routeur.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/routers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nom: nom.trim(),
        description: "Point WiFi MikroTik",
        systeme: "MIKROTIK",
        dns_name: "wifi.cybercanvas.local",
        adresse: nom.trim(),
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      setError(result.message || "Erreur lors de l'ajout du routeur.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard/routers");
    router.refresh();
  }

  return (
    <AdminShell title="Nouveau Routeur" breadcrumb="Offres WiFi / Routeurs">
      <div className="mb-5">
        <Link
          href="/dashboard/routers"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Retour aux routeurs
        </Link>
      </div>

      <form
        onSubmit={ajouterRouteur}
        className="max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-black text-slate-900">
          Ajouter un routeur
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Donnez un nom clair au routeur. Le token de connexion sera genere
          automatiquement.
        </p>

        <label className="mt-6 block text-sm font-bold text-slate-700">
          Nom du routeur
          <input
            type="text"
            value={nom}
            onChange={(event) => setNom(event.target.value)}
            placeholder="Ex: Routeur boutique principale"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-cyan-500"
          />
        </label>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Ajout..." : "Ajouter le routeur"}
        </button>
      </form>
    </AdminShell>
  );
}
