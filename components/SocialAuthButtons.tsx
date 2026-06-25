"use client";

import { useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type SocialProvider = {
  id: Provider;
  label: string;
  scopes?: string;
  icon: React.ReactNode;
};

const providers: SocialProvider[] = [
  {
    id: "google",
    label: "Continuer avec Google",
    icon: <GoogleIcon />,
  },
  {
    id: "azure",
    label: "Continuer avec Microsoft",
    scopes: "email",
    icon: <MicrosoftIcon />,
  },
];

export default function SocialAuthButtons() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: SocialProvider) {
    setError("");
    setLoading(provider.id);

    const redirectTo = `${window.location.origin}/auth/callback?next=/espace-client`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: provider.id,
      options: {
        redirectTo,
        scopes: provider.scopes,
      },
    });

    if (oauthError) {
      setError(
        `Connexion ${provider.label.replace("Continuer avec ", "")} indisponible. Verifiez son activation dans Supabase.`
      );
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => signIn(provider)}
            disabled={loading !== null}
            className="flex min-h-12 items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:border-cyan-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            {provider.icon}
            <span>
              {loading === provider.id ? "Redirection..." : provider.label}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs font-bold uppercase text-slate-500">
        <span className="h-px flex-1 bg-slate-700" />
        ou avec votre adresse e-mail
        <span className="h-px flex-1 bg-slate-700" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.9A6.02 6.02 0 0 1 6.07 12c0-.66.11-1.3.32-1.9V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.73 9.39 5.97 12 5.97Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <span
      className="grid h-5 w-5 grid-cols-2 gap-[2px]"
      aria-hidden="true"
    >
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </span>
  );
}
