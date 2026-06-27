"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Lock, ShieldCheck, User, Wifi } from "lucide-react";

type ClientUser = {
  email: string;
  statut?: "en_attente" | "actif" | "refuse" | "suspendu";
};

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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const users = JSON.parse(
      window.localStorage.getItem("cybercanvas-users-demo") || "[]"
    ) as ClientUser[];
    const client = users.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (client) {
      if (client.statut === "en_attente") {
        setError("Votre compte est en attente de validation administrateur.");
        setLoading(false);
        return;
      }

      if (client.statut === "refuse") {
        setError("Votre demande de compte a ete refusee.");
        setLoading(false);
        return;
      }

      if (client.statut === "suspendu") {
        setError("Votre compte est suspendu. Contactez CyberCanvas Services.");
        setLoading(false);
        return;
      }

      // Les anciens comptes locaux passent maintenant par l'API serveur.
    }

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

      setError(result.message || "Connexion impossible");
      setLoading(false);
      return;
    }

    router.replace(nextUrl);
    router.refresh();
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
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-12 pr-4 text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-12 pr-4 text-white outline-none focus:border-cyan-500"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
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
      </form>

      <div className="mt-5 grid gap-3 text-center text-sm text-slate-300">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-900 p-4">

      <div className="mx-auto flex w-full max-w-6xl justify-between gap-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/35 px-4 py-2 text-sm font-bold text-white hover:border-cyan-300"
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
          <div className="glass rounded-3xl border border-cyan-500/20 p-8">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-cyan-500/20 p-4">
                  <Wifi className="h-10 w-10 text-cyan-400" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white">
                CyberCanvas Services
              </h1>

              <p className="mt-2 flex items-center justify-center gap-2 text-slate-300">
                <ShieldCheck size={17} />
                Connexion securisee
              </p>
            </div>

            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}


