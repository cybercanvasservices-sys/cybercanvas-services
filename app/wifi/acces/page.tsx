"use client";

import { useState } from "react";

export default function Page() {
  const [showModal, setShowModal] = useState(false);
  return (
    <main className="p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            ðŸŽŸ Mes AccÃ¨s
          </h1>

          <p className="text-slate-400">
            Gestion des tickets WiFi
          </p>
        </div>

       <button
  onClick={() => setShowModal(true)}
  className="bg-cyan-600 px-5 py-3 rounded-xl"
>
  âž• GÃ©nÃ©rer
</button>
      </div>

      <input
        type="text"
        placeholder="ðŸ” Rechercher..."
        className="w-full border border-slate-700 bg-slate-900 p-3 rounded-xl mb-8"
      />

      <div className="border border-slate-800 rounded-2xl overflow-hidden">

        <div className="grid grid-cols-6 p-4 font-bold bg-slate-900">

          <div>Offre</div>
          <div>Identifiant</div>
          <div>Mot de passe</div>
          <div>Date</div>
          <div>Statut</div>
          <div>Actions</div>

        </div>

        <div className="p-10 text-center text-slate-500">
          Aucun ticket gÃ©nÃ©rÃ©
        </div>

      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">

      <div className="flex justify-between items-center mb-4">

        <h2 className="text-xl font-bold">
          ðŸŽŸ GÃ©nÃ©rer des tickets
        </h2>

        <button
          onClick={() => setShowModal(false)}
          className="text-red-500"
        >
          âœ•
        </button>

      </div>

      <input
        type="text"
        placeholder="Offre"
        className="w-full border border-slate-700 bg-slate-800 p-3 rounded-xl mb-3"
      />

      <input
        type="number"
        placeholder="Premier numÃ©ro"
        className="w-full border border-slate-700 bg-slate-800 p-3 rounded-xl mb-3"
      />

      <input
        type="number"
        placeholder="QuantitÃ©"
        className="w-full border border-slate-700 bg-slate-800 p-3 rounded-xl mb-4"
      />

      <button
        className="w-full bg-cyan-600 p-3 rounded-xl"
      >
        GÃ©nÃ©rer
      </button>

    </div>

  </div>
)}
    </main>
  );
}




