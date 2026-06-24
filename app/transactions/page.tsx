"use client";

export default function TransactionsPage() {
  return (
    <main className="p-8 text-white">
      <h1 className="text-4xl font-bold mb-8">
        💳 Transactions
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 p-6 rounded-2xl">
          <p className="text-slate-400">Transactions</p>
          <h2 className="text-2xl font-bold">0</h2>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <p className="text-slate-400">Aujourd&apos;hui</p>
          <h2 className="text-2xl font-bold text-green-400">
            0 FCFA
          </h2>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <p className="text-slate-400">Cette Semaine</p>
          <h2 className="text-2xl font-bold text-cyan-400">
            0 FCFA
          </h2>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl">
          <p className="text-slate-400">Ce Mois</p>
          <h2 className="text-2xl font-bold text-yellow-400">
            0 FCFA
          </h2>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">
          📋 Historique des Transactions
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="pb-3">Date</th>
                <th className="pb-3">Montant</th>
                <th className="pb-3">Méthode</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="py-4">Aucune transaction</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


