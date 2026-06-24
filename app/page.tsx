"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  BarChart3,
  CheckCircle2,
  Cloud,
  CreditCard,
  Headphones,
  Router,
  Ticket,
  Wifi,
} from "lucide-react";

const features = [
  {
    icon: Wifi,
    title: "Hotspots WiFi",
    text: "Centralisez vos reseaux, profils et acces clients.",
  },
  {
    icon: Ticket,
    title: "Tickets automatiques",
    text: "Importez vos vouchers et vendez-les en ligne.",
  },
  {
    icon: CreditCard,
    title: "Paiements mobiles",
    text: "Encaissez via Mixx by Yas, Flooz et PayGate.",
  },
  {
    icon: Router,
    title: "Routeurs",
    text: "Ajoutez vos routeurs et gardez leurs informations au meme endroit.",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    text: "Suivez les ventes, les revenus et les tickets restants.",
  },
  {
    icon: Headphones,
    title: "Assistance",
    text: "Gardez une trace claire des demandes clients.",
  },
];

const steps = [
  "Ajouter un routeur",
  "Creer les groupes WiFi",
  "Importer les tickets",
  "Partager le lien PayGate",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <CyberCanvasLogo />
            <span className="text-lg font-black tracking-wide">
              CyberCanvas Services
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#solution" className="hover:text-white">
              Solution
            </a>
            <a href="#fonctionnalites" className="hover:text-white">
              Fonctionnalites
            </a>
            <a href="#parcours" className="hover:text-white">
              Parcours
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:border-cyan-300"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Inscription
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 cyber-grid opacity-35" />
        <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl content-center gap-12 px-5 py-16 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-200">
              <CheckCircle2 size={16} />
              Plateforme WiFi prete pour la vente en ligne
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
              CyberCanvas Services
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Gere les routeurs, les groupes WiFi, les tickets, les paiements
              mobiles et les recettes depuis un tableau de bord unique.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <Cloud size={18} />
                Connexion
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-semibold hover:border-cyan-300"
              >
                <Ticket size={18} />
                Inscription
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <Metric value={500} suffix="+" label="clients WiFi" />
              <Metric value={15000} suffix="+" label="tickets vendus" />
              <Metric value={99.9} suffix="%" label="disponibilite" decimals={1} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-950/30"
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-400">Gestion WiFi</p>
                <p className="font-semibold">Routeurs, tickets et paiements</p>
              </div>
              <span className="rounded-lg bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                Pret a vendre
              </span>
            </div>

            <div className="grid gap-3">
              <PreviewCard
                label="Routeurs"
                value="Gestion centralisee"
                text="Ajoutez vos routeurs et gardez leurs informations a jour."
              />
              <PreviewCard
                label="Tickets"
                value="Import CSV"
                text="Importez les tickets par groupe et suivez les disponibilites."
              />
              <PreviewCard
                label="Paiements"
                value="Lien PayGate"
                text="Partagez les liens de paiement dans votre portail captif."
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="solution" className="mx-auto max-w-7xl px-5 py-20">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">
            Logique du projet
          </p>
          <h2 className="mt-3 text-4xl font-bold">
            Une chaine simple: groupe, ticket, paiement, livraison.
          </h2>
        </div>

        <div id="parcours" className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <span className="text-sm text-cyan-300">
                0{index + 1}
              </span>
              <p className="mt-4 font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fonctionnalites" className="border-y border-white/10 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">
                Fonctionnalites
              </p>
              <h2 className="mt-3 text-4xl font-bold">
                Tout ce qu&apos;il faut pour vendre du WiFi.
              </h2>
            </div>
            <Link
              href="/statistiques"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 font-semibold hover:border-cyan-300"
            >
              <BarChart3 size={18} />
              Voir les statistiques
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-white/10 bg-[#0b1626] p-6"
              >
                <feature.icon className="text-cyan-300" size={24} />
                <h3 className="mt-5 text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-3 text-slate-400">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CyberCanvasLogo() {
  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/40"
      aria-label="CyberCanvas Services"
    >
      <div className="absolute inset-1 rounded-xl border border-white/45" />
      <span className="text-base font-black tracking-[-0.02em]">CC</span>
      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-[#07111f]">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
      </span>
      <span className="absolute bottom-2 h-0.5 w-6 rounded-full bg-slate-950/35" />
    </div>
  );
}

function Metric({
  value,
  suffix,
  label,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}) {
  return (
    <div>
      <p className="text-2xl font-bold">
        <CountUp end={value} decimals={decimals} duration={2.2} />
        {suffix}
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function PreviewCard({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}


