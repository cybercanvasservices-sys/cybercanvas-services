"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Home, Lock, RefreshCcw, ShieldCheck, User } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    searchParams?.get("reason") === "inactive"
      ? "Votre session a expire pour cause d'inactivite. Reconnectez-vous pour continuer."
      : ""
  );
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setNeedsVerification(false);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const result = (await response.json()) as {
        message?: string;
      };

      const message = result.message || "Connexion impossible";
      setError(message);
      setNeedsVerification(message.toLowerCase().includes("confirmer"));
      setLoading(false);
      return;
    }

    router.replace(nextUrl);
    router.refresh();
  }

  async function resendVerification() {
    if (!email) {
      setError("Saisissez votre adresse email avant de demander un nouveau lien.");
      return;
    }

    setResending(true);
    setError("");
    setInfo("");

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json()) as { message?: string };

    setResending(false);

    if (!response.ok) {
      setError(result.message || "Impossible de renvoyer le lien.");
      return;
    }

    setInfo(result.message || "Un nouveau lien de validation a ete envoye.");
    setNeedsVerification(false);
  }

  return (
    <LoginShell>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
            Adresse email
          </label>
          <div className="relative">
          <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nom@entreprise.com"
            className="w-full rounded-lg border border-[#cad6d2] bg-white py-3 pl-11 pr-4 text-[#10231f] outline-none focus:border-[#0a7566] focus:ring-2 focus:ring-[#dcebe6]"
          />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Mot de passe
            </label>
            <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-[#0a7566] hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
          <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-lg border border-[#cad6d2] bg-white py-3 pl-11 pr-4 text-[#10231f] outline-none focus:border-[#0a7566] focus:ring-2 focus:ring-[#dcebe6]"
          />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {info && (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a6f61] py-3 font-bold text-white shadow-sm hover:bg-[#075b50] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Connexion"}
          {!loading && <ArrowRight size={18} />}
        </button>

        {needsVerification && (
          <button
            type="button"
            onClick={resendVerification}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 py-3 font-bold text-cyan-100 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={18} />
            {resending ? "Renvoi en cours..." : "Renvoyer le mail de validation"}
          </button>
        )}
      </form>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
        <p>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-[#0a7566] hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </LoginShell>
  );
}

function LoginShell({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="border-b border-[#dfe5e1] bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <BrandLogo size={40} />
          <span>
            <span className="block text-sm font-bold leading-tight">CyberCanvas Services</span>
            <span className="block text-xs text-slate-500">Solutions réseaux & WiFi</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0a7566]"
        >
          <Home size={17} />
          Accueil
        </Link>
      </div>
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-6xl items-center gap-14 px-5 py-12 lg:grid-cols-[1fr_460px]">
        <section className="hidden max-w-xl lg:block">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0a7566]">Espace de gestion</p>
          <h1 className="text-5xl font-bold leading-[1.12] tracking-tight text-slate-950">
            Gérez votre activité WiFi depuis un seul espace.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Suivez vos équipements, vos tickets, vos ventes et vos paiements avec les outils CyberCanvas Services.
          </p>
          <div className="mt-9 flex items-center gap-3 border-l-4 border-[#0a7566] pl-4 text-sm text-slate-600">
            <ShieldCheck className="text-[#0a7566]" size={22} />
            Accès réservé aux clients et administrateurs autorisés.
          </div>
        </section>

        <section className="w-full rounded-xl border border-[#dfe5e1] bg-white p-7 shadow-[0_20px_60px_rgba(24,55,48,0.08)] sm:p-9">
            <div className="mb-8">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0a7566]">
                <ShieldCheck size={17} />
                Connexion sécurisée
              </p>
              <h2 className="text-2xl font-bold text-slate-950">Accéder à votre compte</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Saisissez vos identifiants pour continuer.</p>
            </div>

            {children}
        </section>
      </main>
    </div>
  );
}
