"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Home, Lock, Mail, Phone, RefreshCcw, User, Wifi } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.nom || !form.telephone || !form.email || !form.password) {
      setError("Nom, telephone, email et mot de passe sont obligatoires.");
      return;
    }

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const result = (await response.json()) as { message?: string; emailSent?: boolean };

    if (!response.ok) {
      setError(result.message || "Impossible d'envoyer la demande.");
      return;
    }

    setRegisteredEmail(form.email.trim());
    setForm({
      nom: "",
      telephone: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setMessage(result.message || "Votre demande a ete envoyee.");
  }

  async function resendVerification() {
    if (!registeredEmail) return;

    setResending(true);
    setError("");

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: registeredEmail }),
    });
    const result = (await response.json()) as { message?: string };

    setResending(false);

    if (!response.ok) {
      setError(result.message || "Impossible de renvoyer le lien.");
      return;
    }

    setMessage(result.message || "Un nouveau lien de validation a ete envoye.");
  }

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
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
        >
          Connexion
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-88px)] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="glass rounded-3xl border border-cyan-500/20 p-8">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-cyan-500/20 p-4">
                  <Wifi className="h-10 w-10 text-cyan-400" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white">CyberCanvas Services</h1>
            </div>

            {registeredEmail ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center text-emerald-50">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-300" />
                  <h2 className="text-xl font-black text-white">Compte cree</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                    Un lien de validation a ete envoye a{" "}
                    <span className="font-bold text-white">{registeredEmail}</span>.
                    Ouvrez votre boite email puis cliquez sur le bouton de confirmation.
                  </p>
                </div>

                {message && (
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 py-3 font-bold text-cyan-100 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={18} />
                  {resending ? "Renvoi en cours..." : "Renvoyer le lien"}
                </button>

                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-cyan-500 py-3 text-center font-bold text-black transition hover:bg-cyan-400"
                >
                  Aller a la connexion
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Field icon={<User />} value={form.nom} placeholder="Nom et prenom" onChange={(value) => updateField("nom", value)} />
                <Field icon={<Phone />} value={form.telephone} placeholder="Telephone" type="tel" onChange={(value) => updateField("telephone", value)} />
                <Field icon={<Mail />} value={form.email} placeholder="Adresse email" type="email" onChange={(value) => updateField("email", value)} />
                <Field icon={<Lock />} value={form.password} placeholder="Mot de passe" type="password" onChange={(value) => updateField("password", value)} />
                <Field icon={<Lock />} value={form.confirmPassword} placeholder="Confirmer le mot de passe" type="password" onChange={(value) => updateField("confirmPassword", value)} />

                {error && (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-black transition hover:bg-cyan-400"
                >
                  Creer le compte
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-slate-300">
              Deja membre ?
              <Link href="/login" className="ml-2 font-bold text-cyan-400 hover:text-cyan-300">
                Connexion
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
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
        className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-12 pr-4 text-white outline-none focus:border-cyan-500"
      />
    </div>
  );
}


