"use client";

export default function RecettesPage() {
  return (
    <main className="p-8 text-white">

      <div className="mb-8">

        <h1 className="text-4xl font-bold">
          💰 Recettes
        </h1>

        <p className="text-slate-400 mt-2">
          Suivi des revenus et des ventes.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">

          <p className="text-slate-400 text-sm">
            Revenu du jour
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0 FCFA
          </h2>

        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">

          <p className="text-slate-400 text-sm">
            Revenu du mois
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0 FCFA
          </h2>

        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">

          <p className="text-slate-400 text-sm">
            Tickets vendus
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0
          </h2>

        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">

          <p className="text-slate-400 text-sm">
            Clients connectés
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0
          </h2>

        </div>

      </div>

      <div className="mb-6">

        <input
          type="text"
          placeholder="🔍 Rechercher une transaction..."
          className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900"
        />

      </div>

      <div className="rounded-2xl border border-slate-700 overflow-hidden">

        <div className="grid grid-cols-4 gap-4 p-4 font-bold bg-slate-900">

          <div>Date</div>
          <div>Description</div>
          <div>Montant</div>
          <div>Statut</div>

        </div>

        <div className="p-12 text-center text-slate-400">

          Aucune transaction enregistrée.

        </div>

      </div>

    </main>
  );
}


