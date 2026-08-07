"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { FormEvent, useState } from "react";
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
    setMessage(result.emailSent === false ? result.message || "" : "");
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
    <div className="min-h-screen bg-[#f4f7f5] p-4 text-[#10231f]">

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3" aria-label="CyberCanvas Services">
          <BrandLogo size={40} />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-bold leading-tight">CyberCanvas Services</span>
            <span className="block text-xs text-[#667872]">Solutions réseaux &amp; WiFi</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0a6f61] px-4 py-2 text-sm font-bold text-white hover:bg-[#075b50]"
        >
          Connexion
        </Link>
      </div>

      <div className="flex min-h-[calc(100vh-88px)] items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="rounded-xl border border-[#dfe5e1] bg-white p-7 shadow-[0_20px_60px_rgba(24,55,48,0.08)] sm:p-9">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-xl bg-[#dcebe6] p-3">
                  <BrandLogo size={46} />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#102f2a]">Créer votre compte</h1>
              <p className="mt-2 text-sm text-[#667872]">Rejoignez votre espace de gestion CyberCanvas Services.</p>
            </div>

            {registeredEmail ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-900">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                  <h2 className="text-xl font-black text-emerald-950">Compte cr&eacute;&eacute; avec succ&egrave;s</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Nous avons envoy&eacute; un lien de validation &agrave;{" "}
                    <span className="font-bold text-emerald-950">{registeredEmail}</span>.
                    Consultez votre bo&icirc;te de r&eacute;ception et cliquez sur le bouton de confirmation pour activer votre compte.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    Si vous ne trouvez pas l&rsquo;e-mail, v&eacute;rifiez aussi vos courriers ind&eacute;sirables.
                  </p>
                </div>

                {message && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#b8ccc6] py-3 font-bold text-[#0a6f61] hover:bg-[#edf4f1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw size={18} />
                  {resending ? "Renvoi en cours..." : "Renvoyer le lien"}
                </button>

                <Link
                  href="/login"
                  className="block w-full rounded-lg bg-[#0a6f61] py-3 text-center font-bold text-white hover:bg-[#075b50]"
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
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#0a6f61] py-3 font-bold text-white hover:bg-[#075b50]"
                >
                  Creer le compte
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-slate-600">
              Deja membre ?
              <Link href="/login" className="ml-2 font-bold text-[#0a7566] hover:text-[#075b50]">
                Connexion
              </Link>
            </div>
          </div>
        </div>
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
        className="w-full rounded-lg border border-[#cad6d2] bg-white py-3 pl-12 pr-4 text-[#10231f] outline-none focus:border-[#0a7566] focus:ring-2 focus:ring-[#dcebe6]"
      />
    </div>
  );
}
