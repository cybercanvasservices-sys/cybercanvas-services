"use client";

import {
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_LINK,
} from "@/lib/support";

export default function AssistancePage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Support
        </p>
        <h1 className="mt-2 text-4xl font-bold">Assistance</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Contactez CyberCanvas Services pour l&apos;installation, la maintenance
          ou l&apos;utilisation de la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-6 text-2xl font-bold">Support technique</h2>
          <div className="space-y-5">
            <div>
              <p className="text-slate-400">WhatsApp</p>
              <a
                href={SUPPORT_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-green-400 hover:text-green-300"
              >
                {SUPPORT_WHATSAPP_DISPLAY}
              </a>
            </div>

            <div>
              <p className="text-slate-400">Email</p>
              <p className="text-lg">support@cybercanvasservices.net</p>
            </div>

            <div>
              <p className="text-slate-400">Horaires</p>
              <p>Lundi - Samedi</p>
              <p>08h00 - 18h00</p>
            </div>

            <div>
              <p className="text-slate-400">Services couverts</p>
              <p className="leading-7 text-slate-200">
                Installation WiFi, maintenance reseau, camera de surveillance,
                liaison Point to Point, portail captif et vente de tickets WiFi.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-6 text-2xl font-bold">Envoyer un message</h2>
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Nom complet"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <input
              type="email"
              placeholder="Adresse e-mail"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <input
              type="text"
              placeholder="Sujet"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <textarea
              rows={6}
              placeholder="Decrivez votre besoin..."
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <button className="rounded-xl bg-cyan-500 p-3 font-semibold text-slate-950 hover:bg-cyan-300">
              Envoyer le message
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}


