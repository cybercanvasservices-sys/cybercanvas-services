"use client";

import Link from "next/link";
import { ArrowLeft, Banknote, Globe2, Router } from "lucide-react";
import { use, useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type RouterDetails = {
  id: string;
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

export default function RouterDetailsPage({ params }: Props) {
  const { id } = use(params);
  const [routeur, setRouteur] = useState<RouterDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch(`/api/routers?id=${encodeURIComponent(id)}`)
      .then((response) => response.json())
      .then((result) => {
        if (!active) return;
        setRouteur(result.routeur || null);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AdminShell title="Detail Routeur" breadcrumb="Offres WiFi / Routeurs">
      <div className="mb-5">
        <Link
          href="/dashboard/routers"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Retour aux routeurs
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Chargement du routeur...
        </div>
      ) : !routeur ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center font-semibold text-red-700 shadow-sm">
          Routeur introuvable.
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
                  {routeur.systeme || "Routeur MikroTik"}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  {routeur.nom}
                </h2>
                <p className="mt-2 break-all text-sm text-slate-500">
                  Token : {routeur.token || "-"}
                </p>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-black ${
                  routeur.statut === "online"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {routeur.statut === "online" ? "EN LIGNE" : "HORS LIGNE"}
              </span>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-4">
            <InfoCard
              icon={Router}
              label="Statut"
              value={routeur.statut === "online" ? "En ligne" : "Hors ligne"}
            />
            <InfoCard
              icon={Banknote}
              label="Credits disponibles"
              value={routeur.credits || 0}
              tone="text-cyan-600"
            />
            <InfoCard
              icon={Globe2}
              label="DNS"
              value={routeur.dns_name || "-"}
            />
            <InfoCard
              icon={Globe2}
              label="Systeme"
              value={routeur.systeme || "MIKROTIK"}
            />
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">
              Informations
            </h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <p>
                <span className="font-bold text-slate-800">Nom :</span>{" "}
                {routeur.nom}
              </p>
              <p>
                <span className="font-bold text-slate-800">Cree le :</span>{" "}
                {routeur.created_at
                  ? new Date(routeur.created_at).toLocaleString()
                  : "-"}
              </p>
              <p className="break-all md:col-span-2">
                <span className="font-bold text-slate-800">Token :</span>{" "}
                {routeur.token || "-"}
              </p>
              <p>
                <span className="font-bold text-slate-800">Systeme :</span>{" "}
                {routeur.systeme || "MIKROTIK"}
              </p>
              <p>
                <span className="font-bold text-slate-800">DNS :</span>{" "}
                {routeur.dns_name || "wifi.cybercanvas.local"}
              </p>
              <p className="md:col-span-2">
                <span className="font-bold text-slate-800">Description :</span>{" "}
                {routeur.description || "Point WiFi MikroTik"}
              </p>
              <p className="break-all md:col-span-2">
                <span className="font-bold text-slate-800">Adresse :</span>{" "}
                {routeur.adresse || routeur.token || "-"}
              </p>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  tone = "text-slate-900",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
        <Icon size={20} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <h3 className={`mt-2 text-xl font-black ${tone}`}>{value}</h3>
    </div>
  );
}


