"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
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
        "Un lien sécurisé vient d’être envoyé à votre adresse e-mail. Consultez votre boîte de réception ou vos courriers indésirables. Ce lien expire dans une heure."
    );
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f5] p-4">
      <section className="w-full max-w-md rounded-xl border border-[#dfe5e1] bg-white p-8 text-[#10231f] shadow-[0_20px_60px_rgba(24,55,48,0.08)]">
        <div className="mb-6 flex items-center gap-3 border-b border-[#e3e9e6] pb-5">
          <BrandLogo size={42} />
          <div>
            <p className="text-sm font-bold leading-tight">CyberCanvas Services</p>
            <p className="text-xs text-slate-500">Récupération sécurisée</p>
          </div>
        </div>
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#0a7566] hover:text-[#075b50]"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="mt-5 text-3xl font-black">Lien envoyé</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {message}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#0a6f61] py-3 font-bold text-white hover:bg-[#075b50]"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black">Mot de passe oublié</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Entrez l&apos;adresse e-mail associée à votre compte. Si elle existe,
              nous vous enverrons un lien sécurisé pour modifier votre mot de passe.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Field
                icon={<Mail />}
                value={email}
                placeholder="Adresse e-mail"
                type="email"
                onChange={setEmail}
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0a6f61] py-3 font-bold text-white hover:bg-[#075b50] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Vérification..." : "Recevoir le lien"}
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
        className="w-full rounded-lg border border-[#cad6d2] bg-white py-3 pl-12 pr-4 text-[#10231f] outline-none focus:border-[#0a7566] focus:ring-2 focus:ring-[#dcebe6]"
      />
    </div>
  );
}
