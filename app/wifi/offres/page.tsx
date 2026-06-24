"use client";

export default function OffresPage() {
  return (
    <main className="p-8 text-white">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            👥 Mes Offres
          </h1>

          <p className="text-slate-400 mt-2">
            Gérez vos offres WiFi et vos tarifs.
          </p>
        </div>

        <button className="bg-cyan-600 px-5 py-3 rounded-xl">
          ➕ Nouvelle Offre
        </button>

      </div>

      <div className="mb-8">

        <input
          type="text"
          placeholder="🔍 Rechercher une offre..."
          className="w-full p-4 rounded-xl border border-slate-700 bg-slate-900"
        />

      </div>

      <div className="rounded-2xl border border-slate-700 overflow-hidden">

        <div className="grid grid-cols-5 gap-4 p-4 font-bold bg-slate-900">

          <div>Routeur</div>
          <div>Libellé</div>
          <div>Durée</div>
          <div>Prix</div>
          <div>Actions</div>

        </div>

        <div className="grid grid-cols-5 gap-4 p-4 items-center">

          <div>Cyber Café</div>
          <div>1 Heure</div>
          <div>1h</div>
          <div>200 FCFA</div>

          <div className="flex gap-2">

            <button className="bg-blue-600 px-3 py-1 rounded">
              ✏️
            </button>

            <button className="bg-red-600 px-3 py-1 rounded">
              🗑️
            </button>

          </div>

        </div>

        <div className="grid grid-cols-5 gap-4 p-4 items-center border-t border-slate-700">

          <div>Cyber Café</div>
          <div>3 Heures</div>
          <div>3h</div>
          <div>500 FCFA</div>

          <div className="flex gap-2">

            <button className="bg-blue-600 px-3 py-1 rounded">
              ✏️
            </button>

            <button className="bg-red-600 px-3 py-1 rounded">
              🗑️
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}


