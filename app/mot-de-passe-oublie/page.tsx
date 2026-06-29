"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(result.message || "Demande impossible.");
      return;
    }

    setMessage(result.message || "Demande envoyee.");
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

        <h1 className="text-3xl font-black">Mot de passe oublie</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Entrez l'adresse e-mail associee a votre compte. Si elle correspond a
          un compte CyberCanvas Services, un lien de recuperation sera envoye.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field
            icon={<Mail />}
            value={email}
            placeholder="Adresse email"
            type="email"
            onChange={setEmail}
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
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Recevoir le lien"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-3.5 text-slate-400 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3 pl-12 pr-4 text-white outline-none focus:border-cyan-500"
      />
    </div>
  );
}
