"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Lock, RefreshCcw, ShieldCheck, User, Wifi } from "lucide-react";

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
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    searchParams.get("reason") === "inactive"
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
        <div className="relative">
          <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Adresse email"
            className="auth-input w-full rounded-xl py-3 pl-12 pr-4 outline-none"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            className="auth-input w-full rounded-xl py-3 pl-12 pr-4 outline-none"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {info && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-800">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Connexion"}
        </button>

        <div className="text-right">
          <Link
            href="/mot-de-passe-oublie"
            className="text-sm font-bold text-cyan-300 hover:text-cyan-100"
          >
            Mot de passe oublie ?
          </Link>
        </div>

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

      <div className="mt-5 grid gap-3 text-center text-sm text-slate-500">
        <p>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-bold text-cyan-300 hover:text-cyan-200">
            Inscription
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
    <div className="auth-page p-4">

      <div className="mx-auto flex w-full max-w-6xl justify-between gap-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-cyan-300"
        >
          <Home size={17} />
          Accueil
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
        >
          Inscription
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-88px)] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="auth-card rounded-2xl p-8">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-cyan-50 p-4">
                  <Wifi className="h-10 w-10 text-cyan-700" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                CyberCanvas Services
              </h1>

              <p className="mt-2 flex items-center justify-center gap-2 text-slate-500">
                <ShieldCheck size={17} />
                Connexion sécurisée
              </p>
            </div>

            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}


