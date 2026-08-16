"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Router,
  Camera,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Ticket,
  Star,
  Upload,
  User,
  Wallet,
} from "lucide-react";

const RETRAIT_MINIMUM = 2000;
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
  const [solde, setSolde] = useState(0);

  const commission = 0;
  const netClient = solde;
  const retraitDisponible = solde >= RETRAIT_MINIMUM;

  useEffect(() => {
    let active = true;

    async function refreshDashboard() {
      try {
        const sessionResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const result = (await sessionResponse.json()) as SessionProfile;
        if (!active) return;

        setSession(result);
        const ventesResponse = await fetch("/api/ventes", { cache: "no-store" });
        if (ventesResponse.ok) {
          const ventesResult = (await ventesResponse.json()) as { ventes?: { montant?: number | null }[] };
          setSolde((ventesResult.ventes || []).reduce((total, vente) => total + Number(vente.montant || 0), 0));
        }
        if (result.client?.photo) setPhoto(result.client.photo);
      } catch {
        if (active) setSession(null);
      }
    }

    void refreshDashboard();
    window.addEventListener("focus", refreshDashboard);
    const interval = window.setInterval(refreshDashboard, 15000);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshDashboard);
      window.clearInterval(interval);
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
    <AdminShell title="Tableau de bord" breadcrumb="Vue d&apos;ensemble">
      <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Espace CyberCanvas</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Bonjour, {displayName}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Retrouvez ici l&apos;&eacute;tat de vos services, vos acc&egrave;s rapides et les derni&egrave;res actions &agrave; effectuer.</p>
          </div>
          <Link href="/wifi/offres" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">G&eacute;rer mes offres <ArrowUpRight size={17} /></Link>
        </div>
      </section>
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric icon={Activity} label="État du service" value={isActiveClient ? "Actif" : "En attente"} tone={isActiveClient ? "success" : "warning"} />
        <DashboardMetric icon={Ticket} label="Tickets disponibles" value="0" />
        <DashboardMetric icon={Wallet} label="Solde actuel" value={`${solde.toLocaleString("fr-FR")} FCFA`} />
        <DashboardMetric icon={ShieldCheck} label="Compte sécurisé" value={client?.email_verified || isAdmin ? "Vérifié" : "À vérifier"} tone={client?.email_verified || isAdmin ? "success" : "warning"} />
      </section>
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Acc&egrave;s rapides</p><h2 className="mt-1 text-lg font-black text-slate-900">G&eacute;rer votre activit&eacute;</h2></div><Activity className="text-cyan-700" size={22} /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <QuickAction href="/wifi/offres" title="Offres WiFi" text="Cr&eacute;er et g&eacute;rer vos offres" icon={Ticket} />
            <QuickAction href="/routeurs" title="Routeurs" text="Suivre vos &eacute;quipements" icon={Router} />
            <QuickAction href="/statistiques" title="Statistiques" text="Analyser votre activit&eacute;" icon={BarChart3} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Prochaine &eacute;tape</p><h2 className="mt-1 text-lg font-black text-slate-900">Activez votre espace</h2><p className="mt-3 text-sm leading-6 text-slate-500">Configurez votre premi&egrave;re offre et connectez un routeur pour commencer &agrave; vendre vos acc&egrave;s WiFi.</p><Link href="/wifi/offres" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-700 hover:text-cyan-900">Commencer <ArrowUpRight size={16} /></Link></div>
      </section>      {!isActiveClient && (
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

      {isAdmin && (
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
                Test administrateur
              </p>
              <p className="mt-1 text-sm font-semibold leading-6">
                Preparez et testez les scripts VPN MikroTik v6/v7 avant de les
                proposer aux clients.
              </p>
            </div>
          </div>
          <a
            href="/vpn-test"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <ShieldCheck size={18} />
            Ouvrir VPN test
          </a>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardTitle title="Etat general" />

          <div className="mt-7 flex flex-col items-center text-center">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500">
              {photo ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${photo})` }}
                  aria-label="Photo du profil"
                />
              ) : (
                <User size={58} strokeWidth={1.8} />
              )}
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              {displayName}
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              {displaySubtitle}
            </p>

            <div className="mt-5 w-full space-y-3 text-left text-sm font-semibold text-slate-600">
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
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardTitle title="Autres informations" />

          <div className="mt-7 space-y-5">
            <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                Identifiant compte
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                  {initials}
                </div>
                <div>
                  <p className="font-black text-slate-950">{displayName}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {isAdmin ? "Espace administrateur" : "Espace client"}
                  </p>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-50">
              <Camera size={18} />
              Changer la photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={choisirPhoto}
              />
            </label>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Evaluation service
              </p>
              <div className="mt-3 flex items-center gap-1 text-amber-400">
                {[0, 1, 2, 3, 4].map((item) => (
                  <Star key={item} size={22} fill="currentColor" />
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {isActiveClient
                  ? "Votre espace est pret pour gerer vos services WiFi."
                  : "Vos services WiFi seront actifs apres validation admin."}
              </p>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50">
              <Upload size={18} />
              Charger une piece
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CardTitle title="Portefeuille" />

          <div className="mt-7 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/80">
                  Solde portefeuille
                </p>
                <p className="mt-1 text-3xl font-black">
                  {solde.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/18">
                <Wallet size={28} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm font-bold text-slate-700 sm:grid-cols-2">
            <MiniStat icon={CreditCard} label="Commission" value={`${commission} FCFA`} />
            <MiniStat icon={CheckCircle2} label="Net estime" value={`${netClient} FCFA`} />
          </div>

          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            Retrait possible a partir de {RETRAIT_MINIMUM} FCFA. Votre demande sera
            vérifiée avant le paiement. La commission CyberCanvas Services de 10% est deja prelevee sur chaque ticket vendu.
          </div>

          {message && (
            <p className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-sm font-bold text-cyan-800">
              {message}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-300 px-4 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-50">
              <ShieldCheck size={18} />
              Charger
            </button>
            <button
              onClick={demanderRetrait}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              <Wallet size={18} />
              Retrait
            </button>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function DashboardMetric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone?: "success" | "warning" }) {
  const color = tone === "success" ? "text-emerald-700 bg-emerald-50" : tone === "warning" ? "text-amber-700 bg-amber-50" : "text-cyan-700 bg-cyan-50";
  const valueColor = tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-slate-900";
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className={`mt-1 text-xl font-black ${valueColor}`}>{value}</p></div>;
}

function QuickAction({ href, title, text, icon: Icon }: { href: string; title: string; text: string; icon: React.ElementType }) {
  return <Link href={href} className="group rounded-xl border border-slate-200 p-4 hover:border-cyan-300 hover:bg-cyan-50"><Icon className="text-cyan-700" size={20} /><p className="mt-3 text-sm font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></Link>;
}
function CardTitle({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-center text-lg font-black text-slate-700">{title}</h2>
      <div className="mt-5 h-px bg-slate-200" />
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
      ? "font-black text-emerald-600"
      : tone === "warning"
        ? "font-black text-amber-600"
        : "font-black text-slate-950";

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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="text-slate-500" size={20} />
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-slate-950">{value}</p>
    </div>
  );
}



