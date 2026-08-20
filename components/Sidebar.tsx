"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  ChevronDown,
  Layers,
  LogOut,
  Router,
  Shield,
  ShoppingBag,
  Ticket,
  User,
  Users,
} from "lucide-react";

const offerLinks = [
  { href: "/dashboard/routers", label: "Mes Cybers", icon: Router },
  { href: "/profils", label: "Mes Profils", icon: Layers },
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
  const pathname = usePathname() || "/";
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
        className={`fixed inset-y-0 left-0 z-50 w-[264px] max-w-[82vw] overflow-y-auto border-r border-[#21473f] bg-[#102f2a] text-slate-200 shadow-xl shadow-black/10 transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-start gap-3">
            <BrandLogo size={44} inverted />
            <div className="min-w-0 flex-1">
              <div className="leading-tight">
                <span className="block text-[15px] font-extrabold tracking-tight text-white">
                  CyberCanvas
                </span>
                <span className="block text-xs font-semibold tracking-[0.12em] text-[#a8c6bf]">
                  Services
                </span>
              </div>
              <span className="mt-2 block truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {isAdmin ? "Espace administrateur" : "Espace client"}
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-5">
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
                href="/commissions"
                label="Commissions"
                icon={Banknote}
                pathname={pathname}
                onNavigate={onClose}
              />
              <NavLink
                href="/boutique-admin"
                label="Gestion boutique"
                icon={ShoppingBag}
                pathname={pathname}
                onNavigate={onClose}
              />
            </>
          )}

          {!isAdmin && (
            <NavLink
              href="/boutique"
              label="Boutique"
              icon={ShoppingBag}
              pathname={pathname}
              onNavigate={onClose}
            />
          )}

          {canUseOffers && (
            <button
              type="button"
              onClick={() => setOffersOpen((open) => !open)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                offersOpen
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  offersOpen
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-slate-300"
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
              {isAdmin && (
                <NavLink
                  href="/vpn-test"
                  label="VPN"
                  icon={Shield}
                  pathname={pathname}
                  compact
                  onNavigate={onClose}
                />
              )}
            </div>
          )}
        </nav>

        <div className="mt-auto px-4 py-5">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[#c0d2cd] hover:bg-red-500/15 hover:text-red-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/8 text-red-200">
              <LogOut size={20} />
            </span>
            Déconnexion
          </button>
        </div>
      </div>
      </aside>
    </>
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
      className={`flex items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
        compact ? "py-2" : "py-3"
      } ${
        active
          ? "bg-white text-[#123b35] shadow-sm"
          : "text-[#c0d2cd] hover:bg-white/6 hover:text-white"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-lg ${
          compact ? "h-8 w-8" : "h-10 w-10"
        } ${
          active
            ? "bg-[#dcebe6] text-[#0a7566]"
            : "bg-white/5 text-[#aac2bc]"
        }`}
      >
        <Icon size={compact ? 17 : 20} />
      </span>
      {label}
    </Link>
  );
}
