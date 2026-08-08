"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function VerificationEmailPage() {
  return (
    <Suspense fallback={<VerificationShell message="Vérification en cours..." loading />}>
      <VerificationEmailContent />
    </Suspense>
  );
}

function VerificationEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [message, setMessage] = useState("Vérification en cours...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Ce lien de vérification est invalide ou incomplet.");
        return;
      }

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { message?: string };

      setStatus(response.ok ? "success" : "error");
      setMessage(result.message || "Vérification terminée.");
    }

    void verifyEmail();
  }, [token]);

  return <VerificationShell message={message} status={status} />;
}

function VerificationShell({
  message,
  loading = false,
  status = loading ? "loading" : "success",
}: {
  message: string;
  loading?: boolean;
  status?: "loading" | "success" | "error";
}) {
  const title = status === "success" ? "Compte vérifié" : status === "error" ? "Vérification impossible" : "Vérification du compte";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f5] p-4 text-[#10231f]">
      <section className="w-full max-w-md rounded-xl border border-[#dfe5e1] bg-white p-8 text-center shadow-[0_20px_60px_rgba(24,55,48,0.08)]">
        <div className="mb-6 flex items-center justify-center gap-3 border-b border-[#e3e9e6] pb-5 text-left">
          <BrandLogo size={42} />
          <div>
            <p className="text-sm font-bold leading-tight">CyberCanvas Services</p>
            <p className="text-xs text-slate-500">Activation sécurisée du compte</p>
          </div>
        </div>

        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          status === "success" ? "bg-emerald-100 text-emerald-700" : status === "error" ? "bg-red-100 text-red-700" : "bg-[#dcebe6] text-[#0a7566]"
        }`}>
          {status === "loading" && <Loader2 className="animate-spin" size={34} />}
          {status === "success" && <CheckCircle2 size={34} />}
          {status === "error" && <XCircle size={34} />}
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {status !== "loading" && (
          <Link href="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#0a6f61] px-5 py-3 font-bold text-white hover:bg-[#075b50]">
            Aller à la connexion
          </Link>
        )}
      </section>
    </main>
  );
}
