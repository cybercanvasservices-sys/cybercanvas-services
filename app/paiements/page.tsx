"use client";

export default function PaiementsPage() {
  return (
    <main className="min-h-screen p-8 text-white">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            💳 Paiements
          </h1>

          <p className="text-slate-400 mt-2">
            Gérez vos abonnements et vos paiements.
          </p>
        </div>

        <button className="bg-cyan-600 px-5 py-3 rounded-xl hover:bg-cyan-500">
          ➕ Nouveau Paiement
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
          <p className="text-slate-400">
            Solde Total
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0 FCFA
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
          <p className="text-slate-400">
            Paiements Aujourd&apos;hui
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
          <p className="text-slate-400">
            Paiements du Mois
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl">
          <p className="text-slate-400">
            Abonnements Actifs
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0
          </h2>
        </div>

      </div>

      <div className="mb-6">

        <input
          type="text"
          placeholder="🔍 Rechercher un paiement..."
          className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 outline-none"
        />

      </div>

      <div className="rounded-2xl border border-slate-700 overflow-hidden">

        <div className="grid grid-cols-6 gap-4 p-4 bg-slate-900 font-bold">

          <div>Référence</div>
          <div>Client</div>
          <div>Montant</div>
          <div>Mode</div>
          <div>Statut</div>
          <div>Actions</div>

        </div>

        <div className="p-12 text-center text-slate-400">
          Aucun paiement enregistré.
        </div>

      </div>

    </main>
  );
}


