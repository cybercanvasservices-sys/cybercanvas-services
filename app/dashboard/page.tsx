"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Star,
  Upload,
  User,
  Wallet,
} from "lucide-react";

const RETRAIT_MINIMUM = 5000;
const COMMISSION_RATE = 0.1;
const SOLDE_DEMO = 0;
const WHATSAPP_FINALISATION_URL =
  "https://wa.me/22870693326?text=Bonjour%20CyberCanvas%20Services%2C%20je%20viens%20de%20valider%20mon%20email%20et%20je%20souhaite%20finaliser%20mon%20inscription.";

export default function DashboardPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const commission = Math.round(SOLDE_DEMO * COMMISSION_RATE);
  const netClient = Math.max(SOLDE_DEMO - commission, 0);
  const retraitDisponible = SOLDE_DEMO >= RETRAIT_MINIMUM;

  const initials = useMemo(() => "CC", []);

  function choisirPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  function demanderRetrait() {
    if (!retraitDisponible) {
      setMessage(`Retrait disponible a partir de ${RETRAIT_MINIMUM} FCFA.`);
      return;
    }

    setMessage(
      `Demande envoyee. Montant net estime: ${netClient} FCFA apres commission.`
    );
  }

  return (
    <AdminShell title="Mon Profil" breadcrumb="Accueil">
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
              Votre email est confirme. Contactez l'administrateur via WhatsApp
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
          Contacter l'administrateur
        </a>
      </div>

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
              CyberCanvas Services
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              Compte administrateur principal
            </p>

            <div className="mt-5 w-full space-y-3 text-left text-sm font-semibold text-slate-600">
              <InfoLine label="Role" value="Administrateur" />
              <InfoLine label="Etat" value="Actif" tone="success" />
              <InfoLine label="Securite" value="Compte protege" />
              <InfoLine label="Service" value="Paiement WiFi" />
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
                  <p className="font-black text-slate-950">CyberCanvas</p>
                  <p className="text-sm font-semibold text-slate-500">
                    Espace administrateur
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
                Qualite de service suivie depuis le tableau de bord.
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
                  {SOLDE_DEMO.toLocaleString("fr-FR")} FCFA
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
            verifiee avant le paiement. Commission CyberCanvas Services: 10% sur
            chaque retrait.
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
  tone?: "success";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span>{label}</span>
      <span
        className={
          tone === "success" ? "font-black text-emerald-600" : "font-black text-slate-950"
        }
      >
        {value}
      </span>
    </div>
  );
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



