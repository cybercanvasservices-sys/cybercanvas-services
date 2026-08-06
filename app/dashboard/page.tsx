"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  User,
  Wallet,
} from "lucide-react";

const RETRAIT_MINIMUM = 2000;
const COMMISSION_RATE = 0.1;
const SOLDE_DEMO = 0;
const WHATSAPP_FINALISATION_URL =
  "https://wa.me/22870693326?text=Bonjour%20CyberCanvas%20Services%2C%20je%20viens%20de%20valider%20mon%20email%20et%20je%20souhaite%20finaliser%20mon%20inscription.";

type ClientProfile = {
  nom?: string | null;
  entreprise?: string | null;
  email?: string | null;
  telephone?: string | null;
  ville?: string | null;
  statut?: string | null;
  discussion?: boolean | null;
  photo?: string | null;
  email_verified?: boolean | null;
  created_at?: string | null;
};

type SessionProfile = {
  role?: "admin" | "client" | null;
  email?: string | null;
  client?: ClientProfile | null;
};

export default function DashboardPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<SessionProfile | null>(null);

  const commission = Math.round(SOLDE_DEMO * COMMISSION_RATE);
  const netClient = Math.max(SOLDE_DEMO - commission, 0);
  const retraitDisponible = SOLDE_DEMO >= RETRAIT_MINIMUM;

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: SessionProfile) => {
        if (!active) return;

        setSession(result);
        if (result.client?.photo) {
          setPhoto(result.client.photo);
        }
      })
      .catch(() => {
        if (active) setSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const isAdmin = session?.role === "admin";
  const client = session?.client || null;
  const displayName = isAdmin
    ? "CyberCanvas Services"
    : client?.nom || session?.email || "Client CyberCanvas";
  const displayEmail = client?.email || session?.email || "";
  const displaySubtitle = isAdmin
    ? "Compte administrateur principal"
    : client?.entreprise && client.entreprise !== "Non renseignee"
      ? client.entreprise
      : "Compte client WiFi";
  const accountStatus = isAdmin ? "actif" : client?.statut || "en_attente";
  const isActiveClient = isAdmin || accountStatus === "actif";
  const initials = useMemo(() => {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CC";
  }, [displayName]);

  function choisirPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 700000) {
      setMessage("Photo trop lourde. Choisissez une image plus legere.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const photoData = String(reader.result);
      setPhoto(photoData);
      setMessage("");

      if (!isAdmin) {
        const response = await fetch("/api/clients", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photo: photoData }),
        });
        const result = (await response.json()) as { message?: string };

        if (!response.ok) {
          setMessage(result.message || "Impossible d'enregistrer la photo.");
          return;
        }

        setMessage("Photo de profil enregistree.");
      }
    };
    reader.readAsDataURL(file);
  }

  function demanderRetrait() {
    if (!retraitDisponible) {
      setMessage(`Retrait disponible a partir de ${RETRAIT_MINIMUM} FCFA.`);
      return;
    }

    window.location.href = "/retraits";
  }

  return (
    <AdminShell title="Mon Profil" breadcrumb="Accueil">
      {!isActiveClient && (
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-white">
            <MessageCircle size={22} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
              Finalisation du compte
            </p>
            <p className="mt-1 text-sm font-semibold leading-6">
              Votre email est confirme. Contactez l&apos;administrateur via WhatsApp
              pour finaliser votre inscription et activer tous les services.
            </p>
          </div>
        </div>
        <a
          href={WHATSAPP_FINALISATION_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
        >
          <MessageCircle size={18} />
          Contacter l&apos;administrateur
        </a>
      </div>
      )}

      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-950">Vue d&apos;ensemble du compte</h2>
        <p className="mt-1 text-sm text-slate-500">Consultez vos informations, votre statut et votre solde.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <CardTitle title="Profil" />
          </div>

          <div className="flex flex-col items-center px-6 py-7 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 text-slate-500">
              {photo ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${photo})` }}
                  aria-label="Photo du profil"
                />
              ) : (
                <User size={42} strokeWidth={1.7} />
              )}
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-950">
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {displaySubtitle}
            </p>

            <div className="mt-6 w-full space-y-3 text-left text-sm text-slate-600">
              <InfoLine label="Role" value={isAdmin ? "Administrateur" : "Client"} />
              <InfoLine
                label="Etat"
                value={statusLabel(accountStatus)}
                tone={accountStatus === "actif" ? "success" : "warning"}
              />
              <InfoLine
                label="Email"
                value={displayEmail || "Non renseigne"}
              />
              <InfoLine
                label="Telephone"
                value={client?.telephone || "Non renseigne"}
              />
              <InfoLine
                label="Ville"
                value={client?.ville || "Non renseignee"}
              />
            </div>

            <label className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Camera size={17} />
              Modifier la photo
              <input type="file" accept="image/*" className="hidden" onChange={choisirPhoto} />
            </label>
          </div>
        </section>

        <div className="space-y-6">
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4"><CardTitle title="Portefeuille" /></div>
          <div className="p-6">
          <div className="bg-[#123d6b] p-6 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/75">
                  Solde portefeuille
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {SOLDE_DEMO.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10">
                <Wallet size={28} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <MiniStat icon={CreditCard} label="Commission" value={`${commission} FCFA`} />
            <MiniStat icon={CheckCircle2} label="Net estime" value={`${netClient} FCFA`} />
          </div>

          <div className="mt-4 border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Retrait possible a partir de {RETRAIT_MINIMUM} FCFA. Votre demande sera
            verifiee avant le paiement. Commission CyberCanvas Services: 10% sur
            chaque retrait.
          </div>

          {message && (
            <p className="mt-4 border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
              {message}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={demanderRetrait}
              className="flex items-center justify-center gap-2 rounded-md bg-[#123d6b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c2f55]"
            >
              <Wallet size={18} />
              Retrait
            </button>
          </div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4"><CardTitle title="Informations du compte" /></div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="flex items-center gap-4 border border-slate-200 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">{initials}</div>
              <div><p className="font-semibold text-slate-950">{displayName}</p><p className="text-sm text-slate-500">{isAdmin ? "Administrateur" : "Client"}</p></div>
            </div>
            <div className="border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Accès aux services</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{isActiveClient ? "Votre espace est actif et prêt à être utilisé." : "Activation en attente de validation administrative."}</p>
            </div>
          </div>
        </section>
        </div>
      </div>
    </AdminShell>
  );
}

function CardTitle({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
    </div>
  );
}

function InfoLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "font-semibold text-emerald-700"
      : tone === "warning"
        ? "font-semibold text-amber-700"
        : "font-semibold text-slate-950";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span>{label}</span>
      <span className={toneClass}>
        {value}
      </span>
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    actif: "Actif",
    en_attente: "En attente",
    refuse: "Refuse",
    suspendu: "Suspendu",
  };

  return labels[status] || status || "En attente";
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <Icon className="text-slate-500" size={20} />
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

