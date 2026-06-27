"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import {
  Camera,
  CheckCircle2,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

type ClientStatus = "en_attente" | "actif" | "refuse" | "suspendu";

type ClientUser = {
  id: number;
  nom: string;
  entreprise?: string;
  email: string;
  telephone: string;
  ville: string;
  statut: ClientStatus;
  discussion: boolean;
  photo?: string;
  createdAt?: string;
  created_at?: string;
};

const initialUsers: ClientUser[] = [
  {
    id: 1,
    nom: "Client portail WiFi",
    entreprise: "Demo WiFi Zone",
    email: "client@cybercanvas.local",
    telephone: "92****52",
    ville: "Lome",
    statut: "actif",
    discussion: true,
    createdAt: new Date().toISOString(),
  },
];
const STORAGE_KEY = "cybercanvas-users-demo";

function maskPhone(phone: string) {
  const clean = phone.replace(/\D/g, "");

  if (clean.length < 4) return phone;

  return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
}

function normalizeUser(user: ClientUser): ClientUser {
  return {
    ...user,
    entreprise: user.entreprise || "Non renseignee",
    telephone: user.telephone.includes("*") ? user.telephone : maskPhone(user.telephone),
    createdAt: user.createdAt || user.created_at || new Date().toISOString(),
  };
}

function loadInitialUsers() {
  if (typeof window === "undefined") {
    return initialUsers;
  }

  try {
    const storedUsers = window.localStorage.getItem(STORAGE_KEY);
    return storedUsers
      ? (JSON.parse(storedUsers) as ClientUser[]).map(normalizeUser)
      : initialUsers;
  } catch {
    return initialUsers;
  }
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<ClientUser[]>(loadInitialUsers);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => {
    const loadedUsers = loadInitialUsers();
    return loadedUsers[0]?.id || null;
  });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    nom: "",
    entreprise: "",
    email: "",
    telephone: "",
    ville: "",
    photo: "",
    discussion: true,
  });

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const pendingCount = users.filter((user) => user.statut === "en_attente").length;

  useEffect(() => {
    let cancelled = false;

    async function loadUsersFromServer() {
      try {
        const response = await fetch("/api/clients", { cache: "no-store" });

        if (!response.ok) return;

        const result = (await response.json()) as { clients?: ClientUser[] };
        const nextUsers = (result.clients || []).map(normalizeUser);

        if (!cancelled) {
          setUsers(nextUsers);
          setSelectedUserId((current) => current || nextUsers[0]?.id || null);
        }
      } catch {
        // La page garde les donnees locales si Supabase n'est pas encore pret.
      }
    }

    loadUsersFromServer();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event("cybercanvas-users-updated"));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return users;

    return users.filter((user) =>
      [user.nom, user.entreprise, user.email, user.telephone, user.ville, user.statut]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [search, users]);

  function resetForm() {
    setForm({
      nom: "",
      entreprise: "",
      email: "",
      telephone: "",
      ville: "",
      photo: "",
      discussion: true,
    });
  }

  function createUser() {
    if (!form.nom.trim() || !form.telephone.trim()) {
      window.alert("Nom et telephone obligatoires.");
      return;
    }

    const nextUser: ClientUser = {
      id: Date.now(),
      nom: form.nom.trim(),
      entreprise: form.entreprise.trim() || "Non renseignee",
      email: form.email.trim() || "Non renseigne",
      telephone: maskPhone(form.telephone),
      ville: form.ville.trim() || "Non renseignee",
      statut: "actif",
      discussion: form.discussion,
      photo: form.photo,
      createdAt: new Date().toISOString(),
    };

    setUsers((current) => [nextUser, ...current]);
    setSelectedUserId(nextUser.id);
    resetForm();
  }

  function updatePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        photo: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  }

  async function patchUser(userId: number, payload: Partial<ClientUser>) {
    const response = await fetch("/api/clients", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: userId, ...payload }),
    });

    const result = (await response.json()) as {
      client?: ClientUser;
      message?: string;
    };

    if (!response.ok || !result.client) {
      window.alert(result.message || "Modification impossible.");
      return null;
    }

    return normalizeUser(result.client);
  }

  async function updateUserStatus(userId: number, statut: ClientStatus) {
    const updatedUser = await patchUser(userId, { statut });

    if (!updatedUser) return;

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? updatedUser : user
      )
    );
  }

  async function toggleDiscussion(userId: number) {
    const user = users.find((item) => item.id === userId);

    if (!user || user.statut !== "actif") return;

    const updatedUser = await patchUser(userId, {
      discussion: !user.discussion,
    });

    if (!updatedUser) return;

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? updatedUser : user
      )
    );
  }

  async function toggleStatus(userId: number) {
    const user = users.find((item) => item.id === userId);

    if (!user) return;

    const updatedUser = await patchUser(userId, {
      statut: user.statut === "actif" ? "suspendu" : "actif",
    });

    if (!updatedUser) return;

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? updatedUser : user
      )
    );
  }

  async function deleteUser(userId: number) {
    const confirmed = window.confirm("Supprimer cet utilisateur ?");

    if (!confirmed) return;

    const response = await fetch("/api/clients", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: userId }),
    });

    if (!response.ok) {
      const result = (await response.json()) as { message?: string };
      window.alert(result.message || "Suppression impossible.");
      return;
    }

    setUsers((current) => current.filter((user) => user.id !== userId));

    if (selectedUserId === userId) {
      setSelectedUserId(null);
    }
  }

  return (
    <AdminShell title="Utilisateurs" breadcrumb="Utilisateurs">
      {pendingCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="font-black">
            {pendingCount} demande(s) de compte client en attente de validation.
          </p>
          <p className="mt-1 text-sm">
            Validez uniquement les comptes identifies. Un compte non valide ne doit pas demarrer ses activites.
          </p>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-slate-950">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Creer un client
              </h2>
              <p className="text-sm text-slate-500">
                Ajout manuel par l&apos;administrateur.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-white">
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photo} alt="Photo utilisateur" className="h-full w-full object-cover" />
                ) : (
                  <User size={30} />
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-50">
                <Camera size={16} />
                Choisir photo
                <input type="file" accept="image/*" onChange={updatePhoto} className="hidden" />
              </label>
            </div>

            <Input value={form.nom} placeholder="Nom complet" onChange={(value) => setForm((current) => ({ ...current, nom: value }))} />
            <Input value={form.entreprise} placeholder="Entreprise ou zone WiFi" onChange={(value) => setForm((current) => ({ ...current, entreprise: value }))} />
            <Input value={form.email} placeholder="Adresse e-mail" type="email" onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
            <Input value={form.telephone} placeholder="Telephone" onChange={(value) => setForm((current) => ({ ...current, telephone: value }))} />
            <Input value={form.ville} placeholder="Ville ou quartier" onChange={(value) => setForm((current) => ({ ...current, ville: value }))} />

            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">
              Discussions avec support
              <input
                type="checkbox"
                checked={form.discussion}
                onChange={(event) => setForm((current) => ({ ...current, discussion: event.target.checked }))}
                className="h-5 w-5 accent-cyan-500"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={createUser}
            className="mt-5 w-full rounded-lg bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Creer client actif
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Comptes clients
              </h2>
              <p className="text-sm text-slate-500">
                Validez les inscriptions avant de permettre les activites.
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 text-slate-400" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid min-w-0 gap-5">
            <div className="grid gap-3">
              {filteredUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  Aucun compte trouve.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className={`rounded-xl border p-4 transition ${
                      selectedUserId === user.id
                        ? "border-cyan-300 bg-cyan-50"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className="flex min-w-0 flex-1 items-center gap-4 text-left"
                      >
                        <Avatar user={user} />
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-900">
                            {user.nom}
                          </h3>
                          <p className="truncate text-sm text-slate-500">
                            {user.entreprise}
                          </p>
                          <p className="truncate text-sm text-slate-500">{user.email}</p>
                          <p className="text-sm font-bold text-slate-700">{user.telephone}</p>
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <StatusBadge status={user.statut} />
                        {user.statut === "en_attente" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => updateUserStatus(user.id, "actif")}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-black text-white hover:bg-emerald-600"
                            >
                              <UserCheck size={15} />
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => updateUserStatus(user.id, "refuse")}
                              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-black text-white hover:bg-red-600"
                            >
                              <UserX size={15} />
                              Refuser
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleDiscussion(user.id)}
                              disabled={user.statut !== "actif"}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${
                                user.discussion
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              <MessageCircle size={15} />
                              {user.discussion ? "Discussion ON" : "Discussion OFF"}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(user.id)}
                              className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-black text-white hover:bg-indigo-600"
                              title="Changer le statut"
                            >
                              <Pencil size={15} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-black text-white hover:bg-slate-700"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              {selectedUser ? (
                <div>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                    <Avatar user={selectedUser} large />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                        Profil client
                      </p>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedUser.nom}
                      </h3>
                    </div>
                    </div>
                    <StatusBadge status={selectedUser.statut} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                    <InfoLine label="Entreprise" value={selectedUser.entreprise || "Non renseignee"} />
                    <InfoLine label="Email" value={selectedUser.email} />
                    <InfoLine label="Telephone" value={selectedUser.telephone} />
                    <InfoLine label="Ville" value={selectedUser.ville} />
                    <InfoLine label="Statut" value={statusLabel(selectedUser.statut)} />
                    <InfoLine label="Discussion" value={selectedUser.discussion ? "Activee" : "Desactivee"} />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-64 items-center justify-center text-center text-sm text-slate-500">
                  Selectionnez un compte pour voir ses informations.
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      className="rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-cyan-500"
    />
  );
}

function Avatar({ user, large = false }: { user: ClientUser; large?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-white ${
        large ? "h-20 w-20" : "h-14 w-14"
      }`}
    >
      {user.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.photo} alt={user.nom} className="h-full w-full object-cover" />
      ) : (
        <User size={large ? 34 : 24} />
      )}
    </div>
  );
}

function statusLabel(status: ClientStatus) {
  const labels = {
    en_attente: "En attente",
    actif: "Actif",
    refuse: "Refuse",
    suspendu: "Suspendu",
  } satisfies Record<ClientStatus, string>;

  return labels[status];
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const styles = {
    en_attente: "bg-amber-100 text-amber-700",
    actif: "bg-emerald-100 text-emerald-700",
    refuse: "bg-red-100 text-red-700",
    suspendu: "bg-slate-200 text-slate-700",
  } satisfies Record<ClientStatus, string>;

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-black ${styles[status]}`}>
      {status === "actif" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
      {statusLabel(status)}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-black text-slate-900">{value}</p>
    </div>
  );
}
