"use client";

export default function ConfigurationPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Parametres
        </p>
        <h1 className="mt-2 text-4xl font-bold">Configuration</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Informations de base de CyberCanvas Services et parametres de paiement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Informations generales</h2>
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Nom de l'entreprise"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <input
              type="email"
              placeholder="Adresse e-mail"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <input
              type="text"
              placeholder="Telephone"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Paiements mobiles</h2>
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Cle API PayGate"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <input
              type="text"
              placeholder="Numero Flooz"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
            <input
              type="text"
              placeholder="Numero Mixx by Yas"
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 outline-none focus:border-cyan-300"
            />
          </div>
        </section>
      </div>

      <button className="mt-8 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
        Enregistrer
      </button>
    </main>
  );
}
