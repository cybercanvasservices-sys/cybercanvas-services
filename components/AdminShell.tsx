"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CircleHelp,
  PanelLeft,
  ShieldCheck,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

type AdminShellProps = {
  title: string;
  breadcrumb?: string;
  children: React.ReactNode;
};

export default function AdminShell({
  title,
  breadcrumb,
  children,
}: AdminShellProps) {
  const [pendingAccounts, setPendingAccounts] = useState(0);

  useEffect(() => {
    function refreshPendingAccounts() {
      try {
        const users = JSON.parse(
          window.localStorage.getItem("cybercanvas-users-demo") || "[]"
        ) as { statut?: string }[];
        setPendingAccounts(
          users.filter((user) => user.statut === "en_attente").length
        );
      } catch {
        setPendingAccounts(0);
      }
    }

    refreshPendingAccounts();
    window.addEventListener("storage", refreshPendingAccounts);
    window.addEventListener("cybercanvas-users-updated", refreshPendingAccounts);

    return () => {
      window.removeEventListener("storage", refreshPendingAccounts);
      window.removeEventListener(
        "cybercanvas-users-updated",
        refreshPendingAccounts
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-800">
      <Sidebar />

      <div className="min-h-screen pl-[276px]">
        <main className="min-w-0">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label="Menu"
                >
                  <PanelLeft size={20} />
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">
                    CyberCanvas Services
                  </p>
                  <h1 className="text-2xl font-black text-slate-900">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {pendingAccounts > 0 && (
                  <a
                    href="/utilisateurs"
                    className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700"
                  >
                    <Bell size={16} />
                    {pendingAccounts} validation(s)
                  </a>
                )}
                <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 md:inline-flex">
                  Administrateur connecte
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ShieldCheck size={22} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#13233f] via-[#164e63] to-[#0ea5a5] px-6 py-8 text-white">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm text-cyan-100">
                    Accueil / {breadcrumb || title}
                  </p>
                  <p className="mt-3 max-w-3xl text-lg font-medium text-white/90">
                    Gerez vos offres WiFi, vos tickets, vos ventes et
                    vos paiements depuis un espace clair et securise.
                  </p>
                </div>

                <div className="rounded-xl bg-white/12 px-4 py-3 text-sm font-semibold">
                  Service actif
                </div>
              </div>
            </div>
          </header>

          <section className="px-6 py-6">
            <div className="mb-6 flex gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-cyan-950">
              <CircleHelp className="mt-0.5 shrink-0 text-cyan-600" size={20} />
              <p className="text-sm leading-6">
                Parcours recommande: creez une offre WiFi, importez vos tickets
                CSV, puis ouvrez votre page de vente. Les resultats seront visibles
                dans Tickets, Recettes et Statistiques.
              </p>
            </div>

            {children}
          </section>
        </main>
      </div>
    </div>
  );
}






