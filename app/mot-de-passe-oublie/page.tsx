"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

    setMessage(
      result.message ||
        "Un lien securise vient d'etre envoye a votre adresse email. Consultez votre boite de reception ou vos courriers indesirables pour continuer; ce lien expire dans 1 heure."
    );
    setSent(true);
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

        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="mt-5 text-3xl font-black">Lien envoye</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {message}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 py-3 font-black text-slate-950 transition hover:bg-cyan-300"
            >
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black">Mot de passe oublie</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Entrez l&apos;adresse e-mail associee a votre compte. Si elle existe,
              nous vous envoyons un lien securise pour changer votre mot de passe.
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-500 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verification..." : "Recevoir le lien"}
              </button>
            </form>
          </>
        )}
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
