"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clipboard,
  KeyRound,
  ListChecks,
  Plus,
  Router,
  ShieldCheck,
  Trash2,
  Wifi,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";

type RouterOsVersion = "v7" | "v6";
type TestStatus = "pret" | "en_test" | "valide";

type VpnTest = {
  id: number;
  routeur: string;
  client: string;
  version: RouterOsVersion;
  serveur: string;
  statut: TestStatus;
  date: string;
};

const STORAGE_KEY = "cybercanvas-vpn-tests";

const statusLabel: Record<TestStatus, string> = {
  pret: "Pret a tester",
  en_test: "En test",
  valide: "Valide",
};

export default function VpnTestPage() {
  const [routeur, setRouteur] = useState("Routeur test");
  const [client, setClient] = useState("CyberCanvas Services");
  const [version, setVersion] = useState<RouterOsVersion>("v7");
  const [serveur, setServeur] = useState("vpn.cybercanvas.local");
  const [port, setPort] = useState("51820");
  const [username, setUsername] = useState("cc-test");
  const [password, setPassword] = useState(() => generateSecret());
  const [publicKey, setPublicKey] = useState("CLE_PUBLIQUE_DU_SERVEUR_VPN");
  const [tests, setTests] = useState<VpnTest[]>(() => loadTests());
  const [copied, setCopied] = useState(false);

  const script = useMemo(() => {
    if (version === "v7") {
      return buildWireGuardScript({
        routeur,
        serveur,
        port,
        publicKey,
      });
    }

    return buildSstpScript({
      routeur,
      serveur,
      username,
      password,
    });
  }, [password, port, publicKey, routeur, serveur, username, version]);

  const importantInfo = useMemo(
    () => [
      { label: "Routeur", value: routeur || "Routeur test" },
      { label: "Version", value: version === "v7" ? "RouterOS v7 - WireGuard" : "RouterOS v6 - SSTP" },
      { label: "Serveur VPN", value: serveur || "Non renseigne" },
      { label: "Port", value: port || (version === "v7" ? "51820" : "443") },
      {
        label: version === "v7" ? "Cle publique serveur" : "Utilisateur VPN",
        value: version === "v7" ? publicKey || "A renseigner" : username || "A renseigner",
      },
      {
        label: version === "v7" ? "Adresse VPN routeur" : "Mot de passe VPN",
        value: version === "v7" ? "10.77.0.2/24" : password || "A renseigner",
      },
    ],
    [password, port, publicKey, routeur, serveur, username, version]
  );

  function saveTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTests = [
      {
        id: Date.now(),
        routeur: routeur.trim() || "Routeur test",
        client: client.trim() || "CyberCanvas Services",
        version,
        serveur: serveur.trim() || "Non renseigne",
        statut: "pret" as TestStatus,
        date: new Date().toISOString(),
      },
      ...tests,
    ];

    setTests(nextTests);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTests));
  }

  async function copyScript() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function updateStatus(id: number, statut: TestStatus) {
    const nextTests = tests.map((test) =>
      test.id === id ? { ...test, statut } : test
    );

    setTests(nextTests);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTests));
  }

  function deleteTest(id: number) {
    const nextTests = tests.filter((test) => test.id !== id);

    setTests(nextTests);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTests));
  }

  function clearTests() {
    setTests([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AdminShell title="VPN test" breadcrumb="Administration / VPN test">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
                Test administrateur
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Generateur VPN MikroTik
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Cette page reste reservee a l&apos;administrateur. Utilisez-la pour
                tester l&apos;acces distant avant de proposer le service VPN aux
                clients.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
              <ShieldCheck size={17} />
              Non visible client
            </div>
          </div>

          <form onSubmit={saveTest} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom du routeur">
                <input
                  value={routeur}
                  onChange={(event) => setRouteur(event.target.value)}
                  className="field-input"
                  placeholder="Ex: Routeur boutique Kodjo"
                />
              </Field>

              <Field label="Client ou site test">
                <input
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                  className="field-input"
                  placeholder="Ex: Boutique principale"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Version MikroTik">
                <select
                  value={version}
                  onChange={(event) => setVersion(event.target.value as RouterOsVersion)}
                  className="field-input"
                >
                  <option value="v7">RouterOS v7 - WireGuard</option>
                  <option value="v6">RouterOS v6 - SSTP</option>
                </select>
              </Field>

              <Field label="Serveur VPN">
                <input
                  value={serveur}
                  onChange={(event) => setServeur(event.target.value)}
                  className="field-input"
                  placeholder="vpn.domaine.com"
                />
              </Field>

              <Field label={version === "v7" ? "Port WireGuard" : "Port SSTP"}>
                <input
                  value={port}
                  onChange={(event) => setPort(event.target.value)}
                  className="field-input"
                  placeholder={version === "v7" ? "51820" : "443"}
                />
              </Field>
            </div>

            {version === "v7" ? (
              <Field label="Cle publique du serveur WireGuard">
                <input
                  value={publicKey}
                  onChange={(event) => setPublicKey(event.target.value)}
                  className="field-input"
                  placeholder="Cle publique du serveur VPN"
                />
              </Field>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nom utilisateur SSTP">
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="field-input"
                  />
                </Field>
                <Field label="Mot de passe SSTP">
                  <div className="flex gap-2">
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="field-input"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(generateSecret())}
                      className="rounded-lg border border-slate-300 px-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      Generer
                    </button>
                  </div>
                </Field>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400"
              >
                <Plus size={17} />
                Ajouter au journal test
              </button>
              <button
                type="button"
                onClick={copyScript}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                <Clipboard size={17} />
                {copied ? "Script copie" : "Copier le script"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Script terminal
              </p>
              <h2 className="mt-2 text-xl font-black">
                {version === "v7" ? "WireGuard RouterOS v7" : "SSTP RouterOS v6"}
              </h2>
            </div>
            <KeyRound className="text-cyan-300" size={28} />
          </div>
          <pre className="mt-5 max-h-[520px] overflow-auto rounded-xl border border-white/10 bg-black/35 p-4 text-xs leading-6 text-cyan-50">
            <code>{script}</code>
          </pre>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
              <BookOpen size={21} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
                Mode d&apos;utilisation important
              </p>
              <h2 className="text-xl font-black text-slate-950">
                Comment utiliser le script
              </h2>
            </div>
          </div>

          <ol className="mt-5 space-y-3 text-sm font-semibold leading-6 text-slate-700">
            <li className="rounded-xl bg-slate-50 p-3">
              1. Connectez-vous au MikroTik avec Winbox ou WebFig.
            </li>
            <li className="rounded-xl bg-slate-50 p-3">
              2. Ouvrez le terminal du routeur, collez le script, puis validez.
            </li>
            <li className="rounded-xl bg-slate-50 p-3">
              3. Verifiez que l&apos;interface VPN est active et que le routeur ping le
              serveur VPN.
            </li>
            <li className="rounded-xl bg-slate-50 p-3">
              4. Testez l&apos;acces distant uniquement via VPN. Ne publiez pas Winbox
              directement sur Internet.
            </li>
            <li className="rounded-xl bg-slate-50 p-3">
              5. Si le test marche, marquez le routeur comme valide dans le journal.
            </li>
          </ol>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ListChecks size={21} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600">
                Informations importantes
              </p>
              <h2 className="text-xl font-black text-slate-950">
                A noter avant le test
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {importantInfo.map((info) => (
              <div
                key={info.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  {info.label}
                </p>
                <p className="mt-2 break-words text-sm font-black text-slate-950">
                  {info.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
            Gardez les mots de passe, cles et identifiants VPN dans un endroit
            securise. Ces informations ne doivent pas etre envoyees au client
            tant que le service VPN n&apos;est pas officiellement active.
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">
              Journal interne
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Tests VPN en cours
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Prix prevu apres lancement: 6000 FCFA/an.
          </p>
          {tests.length > 0 && (
            <button
              type="button"
              onClick={clearTests}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Vider le journal
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3">
          {tests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
              Aucun test VPN ajoute pour le moment.
            </div>
          ) : (
            tests.map((test) => (
              <article
                key={test.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr] lg:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                    <Router size={20} />
                  </span>
                  <div>
                    <p className="font-black text-slate-950">{test.routeur}</p>
                    <p className="text-sm font-semibold text-slate-500">{test.client}</p>
                  </div>
                </div>
                <Metric icon={Wifi} label="Serveur" value={test.serveur} />
                <Metric label="Version" value={test.version === "v7" ? "v7 WireGuard" : "v6 SSTP"} />
                <Metric label="Statut" value={statusLabel[test.statut]} />
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => updateStatus(test.id, "en_test")}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-white"
                  >
                    En test
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(test.id, "valide")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-600"
                  >
                    <CheckCircle2 size={14} />
                    Valide
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTest(test.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <style jsx>{`
        .field-input {
          margin-top: 0.5rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1rem;
          color: #0f172a;
          outline: none;
        }

        .field-input:focus {
          border-color: #06b6d4;
        }
      `}</style>
    </AdminShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {Icon && <Icon size={14} />}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function loadTests(): VpnTest[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as VpnTest[];
  } catch {
    return [];
  }
}

function generateSecret() {
  return `CC-${Math.random().toString(36).slice(2, 8)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function sanitizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "routeur-test";
}

function buildWireGuardScript({
  routeur,
  serveur,
  port,
  publicKey,
}: {
  routeur: string;
  serveur: string;
  port: string;
  publicKey: string;
}) {
  const name = sanitizeName(routeur);

  return `# CyberCanvas Services - Test VPN MikroTik RouterOS v7
# Objectif: connecter le routeur au serveur VPN WireGuard pour acces distant admin.
# Remplacez les valeurs du serveur si necessaire avant execution.

/interface wireguard
add name=wg-cybercanvas-${name} listen-port=${port || "51820"} comment="CyberCanvas VPN test"

/ip address
add address=10.77.0.2/24 interface=wg-cybercanvas-${name} comment="CyberCanvas VPN test"

/interface wireguard peers
add interface=wg-cybercanvas-${name} public-key="${publicKey}" endpoint-address="${serveur}" endpoint-port=${port || "51820"} allowed-address=10.77.0.0/24 persistent-keepalive=25s comment="CyberCanvas serveur VPN"

/ip firewall filter
add chain=input action=accept in-interface=wg-cybercanvas-${name} comment="Autoriser administration via VPN CyberCanvas"

# Verification:
# /interface/wireguard/print
# /interface/wireguard/peers/print
# /ping 10.77.0.1
# IMPORTANT: ne pas ouvrir Winbox directement sur Internet. Utiliser le VPN.`;
}

function buildSstpScript({
  routeur,
  serveur,
  username,
  password,
}: {
  routeur: string;
  serveur: string;
  username: string;
  password: string;
}) {
  const name = sanitizeName(routeur);

  return `# CyberCanvas Services - Test VPN MikroTik RouterOS v6
# Objectif: connecter le routeur au serveur VPN SSTP pour acces distant admin.
# SSTP est choisi pour v6 car WireGuard n'est pas natif sur RouterOS v6.

/interface sstp-client
add name=sstp-cybercanvas-${name} connect-to="${serveur}" user="${username}" password="${password}" disabled=no profile=default-encryption verify-server-certificate=no comment="CyberCanvas VPN test"

/ip firewall filter
add chain=input action=accept in-interface=sstp-cybercanvas-${name} comment="Autoriser administration via VPN CyberCanvas"

# Verification:
# /interface/sstp-client/print
# /log/print where message~"sstp"
# /ping 10.77.0.1
# IMPORTANT: ne pas ouvrir Winbox directement sur Internet. Utiliser le VPN.`;
}
