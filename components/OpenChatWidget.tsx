"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, Search, Send, User, X } from "lucide-react";
import { SUPPORT_WHATSAPP_LINK } from "@/lib/support";

export default function OpenChatWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    question: "",
  });
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function sendMessage() {
    setError("");

    if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim()) {
      setError("Le nom, l’adresse e-mail et le téléphone sont obligatoires.");
      return;
    }

    const text = encodeURIComponent(
      [
        "Bonjour CyberCanvas Services, j'ai besoin d'aide.",
        `Nom prenoms: ${form.nom.trim()}`,
        `E-mail: ${form.email.trim()}`,
        `Téléphone : +228 ${form.telephone.trim()}`,
        `Question: ${form.question.trim() || "Non renseignee"}`,
      ].join("\n")
    );

    window.open(`${SUPPORT_WHATSAPP_LINK}?text=${text}`, "_blank");
    setForm({
      nom: "",
      email: "",
      telephone: "",
      question: "",
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[340px] overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950 text-white shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center justify-between border-b border-white/10 bg-cyan-500 px-4 py-3 text-slate-950">
            <div>
              <p className="text-sm font-black">Assistance en ligne</p>
              <p className="text-xs font-semibold">CyberCanvas Services</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-950/10 p-1 hover:bg-slate-950/20"
              aria-label="Fermer le chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
              Rechercher une reponse
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                <input
                  value={form.question}
                  onChange={(event) => updateField("question", event.target.value)}
                  placeholder="Ecrivez votre question..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
            </label>

            <ChatInput
              icon={<User size={17} />}
              label="Nom et prenoms"
              value={form.nom}
              onChange={(value) => updateField("nom", value)}
              required
            />
            <ChatInput
              icon={<Mail size={17} />}
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              required
            />

            <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-300">
              Téléphone <span className="text-cyan-300">*</span>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-slate-900 focus-within:border-cyan-400">
                <span className="flex items-center gap-1 border-r border-white/10 px-3 text-sm font-black text-cyan-200">
                  <Phone size={16} />
                  +228
                </span>
                <input
                  value={form.telephone}
                  onChange={(event) => updateField("telephone", event.target.value)}
                  placeholder="Téléphone"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs font-semibold text-red-100">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={sendMessage}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300"
            >
              <Send size={16} />
              Envoyer
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-xl shadow-cyan-950/40 transition hover:scale-105 hover:bg-cyan-300"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle size={25} />
      </button>
    </div>
  );
}

function ChatInput({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-300">
      {label} {required && <span className="text-cyan-300">*</span>}
      <div className="relative mt-2">
        <span className="absolute left-3 top-3 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400"
        />
      </div>
    </label>
  );
}

