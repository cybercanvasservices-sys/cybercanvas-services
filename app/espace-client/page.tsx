"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, UserRound, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EspaceClientPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email || "Compte client");
      setLoading(false);
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    window.localStorage.removeItem("cybercanvas-client-session");
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Verification du compte...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 px-5 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 font-black">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-slate-950">
              <Wifi size={24} />
            </span>
            CyberCanvas Services
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:border-cyan-300"
          >
            <LogOut size={17} />
            Deconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
              <UserRound size={38} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                Espace client
              </p>
              <h1 className="mt-1 text-2xl font-black">Bienvenue</h1>
              <p className="mt-1 font-semibold text-slate-500">{email}</p>
            </div>
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <ShieldCheck className="mt-0.5 shrink-0" size={21} />
            <p className="text-sm font-semibold">
              Votre connexion Google ou Microsoft est securisee par Supabase.
              Les services client seront accessibles ici.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
