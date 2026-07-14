"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  ChevronDown,
  Layers,
  LogOut,
  Router,
  Shield,
  Ticket,
  User,
  Users,
} from "lucide-react";

const offerLinks = [
  { href: "/dashboard/routers", label: "Mes Routeurs", icon: Router },
  { href: "/profils", label: "Mes Groupes", icon: Layers },
  { href: "/tickets", label: "Mes Tickets", icon: Ticket },
  { href: "/ventes", label: "Mes Recettes", icon: Banknote },
  { href: "/retraits", label: "Mes Retraits", icon: Banknote },
];

type SidebarRole = "admin" | "client" | null;

export default function Sidebar({
  role,
  clientStatus,
  open = false,
  onClose,
}: {
  role?: SidebarRole;
  clientStatus?: string | null;
  clientName?: string | null;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin";
  const canUseOffers = isAdmin || clientStatus === "actif";
  const [offersOpen, setOffersOpen] = useState(() =>
    offerLinks.some(
      (link) =>
        pathname === link.href ||
        pathname.startsWith(`${link.href}/`)
    )
  );

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[276px] max-w-[82vw] overflow-y-auto bg-[#101827] text-slate-200 shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-start gap-3">
            <CyberCanvasLogo />
            <div className="min-w-0 flex-1">
              <div className="leading-tight">
                <span className="block text-[15px] font-black tracking-wide text-white">
                  CyberCanvas
                </span>
                <span className="block text-[15px] font-black tracking-wide text-cyan-100">
                  Services
                </span>
              </div>
              <span className="mt-2 block truncate text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {isAdmin ? "Admin" : "Membre connecte"}
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-4 py-5">
          <NavLink
            href="/dashboard"
            label="Mon profil"
            icon={User}
            pathname={pathname}
            onNavigate={onClose}
          />

          {isAdmin && (
            <>
              <NavLink
                href="/utilisateurs"
                label="Utilisateurs"
                icon={Users}
                pathname={pathname}
                onNavigate={onClose}
              />
              <NavLink
                href="/vpn-test"
                label="VPN test"
                icon={Shield}
                pathname={pathname}
                onNavigate={onClose}
              />
            </>
          )}

          {canUseOffers && (
            <button
              type="button"
              onClick={() => setOffersOpen((open) => !open)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                offersOpen
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  offersOpen
                    ? "bg-slate-950/10 text-slate-950"
                    : "bg-white/8 text-cyan-200"
                }`}
              >
                <Ticket size={20} />
              </span>
              <span className="flex-1 text-left">Offres WiFi</span>
              <ChevronDown
                size={18}
                className={`transition-transform ${
                  offersOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          )}

          {canUseOffers && offersOpen && (
            <div className="ml-6 mt-2 space-y-1 border-l border-white/10 pl-4">
              {offerLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  pathname={pathname}
                  compact
                  onNavigate={onClose}
                />
              ))}
            </div>
          )}
        </nav>

        <div className="mt-auto px-4 py-5">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-300 hover:bg-red-500/15 hover:text-red-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/8 text-red-200">
              <LogOut size={20} />
            </span>
            Deconnexion
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}

function CyberCanvasLogo() {
  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-slate-950 text-cyan-200"
      aria-label="CyberCanvas Services"
    >
      <span className="text-base font-black tracking-tight">CC</span>
      <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#101827] bg-emerald-400" />
      <span className="absolute inset-x-2 bottom-2 h-px rounded-full bg-cyan-300/40" />
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  compact = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const active =
    pathname === href ||
    pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
        compact ? "py-2" : "py-3"
      } ${
        active
          ? "bg-cyan-400 text-slate-950"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-lg ${
          compact ? "h-8 w-8" : "h-10 w-10"
        } ${
          active
            ? "bg-slate-950/10 text-slate-950"
            : "bg-white/8 text-cyan-200"
        }`}
      >
        <Icon size={compact ? 17 : 20} />
      </span>
      {label}
    </Link>
  );
}


