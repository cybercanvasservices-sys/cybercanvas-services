"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CircleHelp,
  Clock3,
  PanelLeft,
  ShieldCheck,
  Users,
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

type PresenceInfo = {
  online: number;
  admins: number;
  clients: number;
  updatedAtGmt: string;
};

function formatLiveTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Lome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatLiveDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Lome",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function AdminShell({
  title,
  breadcrumb,
  children,
}: AdminShellProps) {
  const [pendingAccounts, setPendingAccounts] = useState(0);
  const [role, setRole] = useState<ConnectedRole>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [presence, setPresence] = useState<PresenceInfo | null>(null);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");
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
    function refreshLiveClock() {
      const now = new Date();
      setLiveTime(formatLiveTime(now));
      setLiveDate(formatLiveDate(now));
    }

    refreshLiveClock();
    const timer = window.setInterval(refreshLiveClock, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!role) return;

    let active = true;

    async function refreshPresence() {
      try {
        const response = await fetch("/api/presence", {
          method: "POST",
          cache: "no-store",
        });

        if (!active || !response.ok) return;

        const result = (await response.json()) as PresenceInfo;
        setPresence(result);
      } catch {
        if (active) {
          setPresence(null);
        }
      }
    }

    void refreshPresence();
    const timer = window.setInterval(refreshPresence, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [role]);

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
    <div className="min-h-screen bg-[#eef3f8] text-slate-800">
      <Sidebar
        role={role}
        clientStatus={client?.statut || null}
        clientName={role === "client" ? clientDisplayName : null}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="min-h-screen lg:pl-[276px]">
        <main className="min-w-0">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                  aria-label="Menu"
                >
                  <PanelLeft size={20} />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">
                    CyberCanvas Services
                  </p>
                  <h1 className="break-words text-xl font-black text-slate-900 sm:text-2xl">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {role === "admin" && pendingAccounts > 0 && (
                  <a
                    href="/utilisateurs"
                    className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 sm:px-3 sm:text-sm"
                  >
                    <Bell size={16} />
                    {pendingAccounts} validation(s)
                  </a>
                )}
                <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 md:inline-flex">
                  {role === "admin" ? "Administrateur connecte" : clientDisplayName}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ShieldCheck size={22} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#13233f] via-[#164e63] to-[#0ea5a5] px-4 py-6 text-white sm:px-6 sm:py-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="min-w-0">
                  <p className="text-sm text-cyan-100">
                    Accueil / {breadcrumb || title}
                  </p>
                  <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-white/90 sm:text-lg">
                    Gerez vos offres WiFi, vos tickets, vos ventes et
                    vos paiements depuis un espace clair et securise.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/12 px-4 py-3 text-sm font-semibold">
                    Service actif
                  </div>

                  <div className="min-w-[220px] rounded-2xl border border-white/15 bg-white/14 px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                          Sessions actives
                        </p>
                        <p className="mt-1 text-3xl font-black text-white">
                          {presence?.online ?? (role ? 1 : 0)}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-100">
                        <Users size={22} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-start gap-2 text-cyan-50/90">
                      <Clock3 className="mt-1 shrink-0" size={15} />
                      <div>
                        <p className="text-lg font-black leading-none">
                          {liveTime || formatLiveTime(new Date())}
                        </p>
                        <p className="mt-1 text-xs font-semibold capitalize text-cyan-50/75">
                          {liveDate || formatLiveDate(new Date())}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-cyan-50/70">
                      Activite en direct
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="px-4 py-5 sm:px-6 sm:py-6">
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

      {idleCountdown !== null && idleCountdown > 0 && (
        <div className="fixed bottom-5 left-1/2 z-[80] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl border border-amber-200 bg-white p-4 text-slate-900 shadow-2xl">
          <p className="text-sm font-black text-amber-700">
            Session sur le point d&apos;expirer
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Inactivite detectee. Deconnexion automatique dans{" "}
            <span className="font-black text-slate-950">{idleCountdown}s</span>.
          </p>
          <button
            type="button"
            onClick={() => setIdleCountdown(null)}
            className="mt-3 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950"
          >
            Je suis toujours la
          </button>
        </div>
      )}
    </div>
  );
}






