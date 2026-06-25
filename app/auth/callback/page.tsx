"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackStatus />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function completeLogin() {
      const nextParam = searchParams.get("next");
      const next =
        nextParam?.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : "/espace-client";

      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !data.session?.user) {
        setError(
          "La connexion n'a pas pu etre finalisee. Reessayez depuis la page de connexion."
        );
        return;
      }

      window.localStorage.setItem(
        "cybercanvas-client-session",
        data.session.user.email || data.session.user.id
      );
      router.replace(next);
      router.refresh();
    }

    const timer = window.setTimeout(completeLogin, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <CallbackStatus>
        <p className="text-sm font-semibold text-red-200">{error}</p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950"
        >
          Revenir a la connexion
        </Link>
      </CallbackStatus>
    );
  }

  return <CallbackStatus />;
}

function CallbackStatus({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-900 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
          {children ? <ShieldCheck size={32} /> : <LoaderCircle className="animate-spin" size={32} />}
        </div>
        <h1 className="mt-5 text-2xl font-black">Connexion securisee</h1>
        <div className="mt-3 text-slate-300">
          {children || "Verification de votre compte en cours..."}
        </div>
      </div>
    </main>
  );
}
