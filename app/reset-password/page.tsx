"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const result = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(result.message || "Modification impossible.");
      return;
    }

    setMessage(result.message || "Mot de passe modifie.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-900 p-4">
      <section className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-8 text-white shadow-2xl">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-100"
        >
          <ArrowLeft size={16} />
          Retour connexion
        </Link>

        <h1 className="text-3xl font-black">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field
            value={password}
            placeholder="Nouveau mot de passe"
            onChange={setPassword}
          />
          <Field
            value={confirmPassword}
            placeholder="Confirmer le mot de passe"
            onChange={setConfirmPassword}
          />

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-cyan-500 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Modification..." : "Changer le mot de passe"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 pl-12 pr-4 text-white outline-none focus:border-cyan-500"
      />
    </div>
  );
}
