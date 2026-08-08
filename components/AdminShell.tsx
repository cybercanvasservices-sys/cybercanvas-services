"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CircleHelp,
  PanelLeft,
  UserRound,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

type AdminShellProps = {
  title: string;
  breadcrumb?: string;
  children: React.ReactNode;
};

type ConnectedRole = "admin" | "client" | null;
type ClientInfo = {
  nom?: string | null;
  email?: string | null;
  statut?: string | null;
};

export default function AdminShell({
  title,
  breadcrumb,
  children,
}: AdminShellProps) {
  const [pendingAccounts, setPendingAccounts] = useState(0);
  const [role, setRole] = useState<ConnectedRole>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState<number | null>(null);
  const clientDisplayName = client?.nom || client?.email || "Client";

  useEffect(() => {
    async function refreshPendingAccounts() {
      let currentRole: ConnectedRole = null;

      try {
        const sessionResponse = await fetch("/api/auth/me", { cache: "no-store" });

        if (sessionResponse.ok) {
          const session = (await sessionResponse.json()) as {
            role?: ConnectedRole;
            client?: ClientInfo | null;
          };
          currentRole = session.role || null;
          setClient(session.client || null);
        }
      } catch {
        currentRole = null;
        setClient(null);
      }

      setRole(currentRole);

      if (currentRole !== "admin") {
        setPendingAccounts(0);
        return;
      }

      try {
        const response = await fetch("/api/clients", { cache: "no-store" });

        if (response.ok) {
          const result = (await response.json()) as {
            clients?: { statut?: string }[];
          };

          setPendingAccounts(
            (result.clients || []).filter((user) => user.statut === "en_attente").length
          );
          return;
        }
      } catch {
        // Retour au stockage local si la base n'est pas encore configuree.
      }

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

    void refreshPendingAccounts();
    const listener = () => {
      void refreshPendingAccounts();
    };

    window.addEventListener("storage", listener);
    window.addEventListener("cybercanvas-users-updated", listener);

    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(
        "cybercanvas-users-updated",
        listener
      );
    };
  }, []);

  useEffect(() => {
    if (!role) return;

    const warningAfterMs = 14 * 60 * 1000;
    const logoutAfterMs = 15 * 60 * 1000;
    let warningTimer: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;
    let countdownTimer: ReturnType<typeof setInterval>;

    async function logoutInactiveUser() {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login?reason=inactive";
    }

    function clearTimers() {
      window.clearTimeout(warningTimer);
      window.clearTimeout(logoutTimer);
      window.clearInterval(countdownTimer);
    }

    function resetIdleTimer() {
      clearTimers();
      setIdleCountdown(null);

      warningTimer = setTimeout(() => {
        let secondsLeft = 60;
        setIdleCountdown(secondsLeft);
        countdownTimer = setInterval(() => {
          secondsLeft -= 1;
          setIdleCountdown(secondsLeft);
          if (secondsLeft <= 0) {
            window.clearInterval(countdownTimer);
          }
        }, 1000);
      }, warningAfterMs);

      logoutTimer = setTimeout(() => {
        void logoutInactiveUser();
      }, logoutAfterMs);
    }

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();

    return () => {
      clearTimers();
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [role]);

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-800">
      <Sidebar
        role={role}
        clientStatus={client?.statut || null}
        clientName={role === "client" ? clientDisplayName : null}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="min-h-screen lg:pl-[264px]">
        <main className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[#dfe5e1] bg-white/95 backdrop-blur">
            <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="rounded-lg border border-[#dfe5e1] p-2.5 text-[#405852] hover:bg-[#eef3f0] lg:hidden"
                  aria-label="Menu"
                >
                  <PanelLeft size={20} />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#71837d]">
                    {breadcrumb || "Espace de gestion"}
                  </p>
                  <h1 className="mt-1 break-words text-xl font-extrabold tracking-tight text-[#102f2a] sm:text-2xl">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {role === "admin" && pendingAccounts > 0 && (
                  <a
                    href="/utilisateurs"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 sm:px-3 sm:text-sm"
                  >
                    <Bell size={16} />
                    {pendingAccounts} validation(s)
                  </a>
                )}
                <span className="hidden max-w-56 truncate text-sm font-semibold text-[#405852] md:inline-flex">
                  {role === "admin" ? "Administrateur connecté" : clientDisplayName}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cddbd6] bg-[#edf4f1] text-[#0a7566]">
                  <UserRound size={19} />
                </div>
              </div>
            </div>

            <div className="border-t border-[#dfe5e1] bg-[#edf3f0] px-4 py-3 text-[#405852] sm:px-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="min-w-0">
                  <p className="max-w-3xl text-sm font-medium leading-6 sm:text-base">
                    Gérez vos offres WiFi, vos tickets, vos ventes et vos paiements.
                  </p>
                </div>

              </div>
            </div>
          </header>

          <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 flex gap-3 rounded-lg border border-[#dfe5e1] bg-white p-4 text-[#526861]">
              <CircleHelp className="mt-0.5 shrink-0 text-[#0a7566]" size={20} />
              <p className="text-sm leading-6">
                Parcours recommandé : créez une offre WiFi, importez vos tickets
                CSV, puis ouvrez votre page de vente. Les résultats seront visibles
                dans Tickets, Recettes et Statistiques.
              </p>
            </div>

            {children}
          </section>
        </main>
      </div>

      {idleCountdown !== null && idleCountdown > 0 && (
        <div className="fixed bottom-5 left-1/2 z-[80] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl border border-amber-200 bg-white p-4 text-slate-900 shadow-2xl">
          <p className="text-sm font-black text-amber-700">
            Session sur le point d&apos;expirer
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Inactivité détectée. Déconnexion automatique dans{" "}
            <span className="font-black text-slate-950">{idleCountdown}s</span>.
          </p>
          <button
            type="button"
            onClick={() => setIdleCountdown(null)}
            className="mt-3 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950"
          >
            Je suis toujours là
          </button>
        </div>
      )}
    </div>
  );
}

