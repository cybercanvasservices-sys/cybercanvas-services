"use client";

export default function AccesPage() {
  return (
    <main className="p-8 text-white">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            🎟 Mes Accès
          </h1>

          <p className="text-slate-400 mt-2">
            Gestion des tickets WiFi.
          </p>
        </div>

        <button className="bg-cyan-600 px-5 py-3 rounded-xl">
          ➕ Générer
        </button>

      </div>

      <div className="mb-8">

        <input
          type="text"
          placeholder="🔍 Rechercher un ticket..."
          className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900"
        />

      </div>

      <div className="rounded-2xl border border-slate-700 overflow-hidden">

        <div className="grid grid-cols-6 gap-4 p-4 font-bold bg-slate-900">

          <div>Offre</div>
          <div>Login</div>
          <div>Mot de passe</div>
          <div>Date</div>
          <div>Statut</div>
          <div>Actions</div>

        </div>

        <div className="grid grid-cols-6 gap-4 p-4 items-center">

          <div>1 Heure</div>
          <div>229001</div>
          <div>A7K9P2</div>
          <div>08/06/2026</div>
          <div>Disponible</div>

          <div>
            <button className="bg-red-600 px-3 py-1 rounded">
              🗑️
            </button>
          </div>

        </div>

        <div className="grid grid-cols-6 gap-4 p-4 items-center border-t border-slate-700">

          <div>3 Heures</div>
          <div>229002</div>
          <div>X5M8Q1</div>
          <div>08/06/2026</div>
          <div>Disponible</div>

          <div>
            <button className="bg-red-600 px-3 py-1 rounded">
              🗑️
            </button>
          </div>

        </div>

      </div>

    </main>
  );
}


