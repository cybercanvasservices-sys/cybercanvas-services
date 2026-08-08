"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
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
  const token = searchParams?.get("token") || "";
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

    setMessage(result.message || "Mot de passe modifié.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f5] p-4">
      <section className="w-full max-w-md rounded-xl border border-[#dfe5e1] bg-white p-8 text-[#10231f] shadow-[0_20px_60px_rgba(24,55,48,0.08)]">
        <div className="mb-6 flex items-center gap-3 border-b border-[#e3e9e6] pb-5">
          <BrandLogo size={42} />
          <div><p className="text-sm font-bold">CyberCanvas Services</p><p className="text-xs text-slate-500">Sécurité du compte</p></div>
        </div>
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#0a7566] hover:text-[#075b50]"
        >
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>

        <h1 className="text-3xl font-black">Nouveau mot de passe</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-lg bg-[#0a6f61] py-3 font-bold text-white transition hover:bg-[#075b50] disabled:cursor-not-allowed disabled:opacity-60"
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
        className="w-full rounded-lg border border-[#cad6d2] bg-white py-3 pl-12 pr-4 text-[#10231f] outline-none focus:border-[#0a7566] focus:ring-2 focus:ring-[#dcebe6]"
      />
    </div>
  );
}
