"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function VerificationEmailPage() {
  return (
    <Suspense fallback={<VerificationShell message="Verification en cours..." loading />}>
      <VerificationEmailContent />
    </Suspense>
  );
}

function VerificationEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("Verification en cours...");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Lien de verification invalide.");
        return;
      }

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { message?: string };

      setStatus(response.ok ? "success" : "error");
      setMessage(result.message || "Verification terminee.");
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
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-900 p-4">
      <section className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-8 text-center text-white shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
          {status === "loading" && <Loader2 className="animate-spin" size={34} />}
          {status === "success" && <CheckCircle2 size={34} />}
          {status === "error" && <XCircle size={34} />}
        </div>
        <h1 className="mt-6 text-2xl font-black">Verification du compte</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
        >
          Aller a la connexion
        </Link>
      </section>
    </main>
  );
}
