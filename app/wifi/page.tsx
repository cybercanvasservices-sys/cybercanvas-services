import Link from "next/link";

const links = [
  {
    href: "/wifi/reseaux",
    title: "Mes Reseaux",
    text: "Gerez tous vos reseaux et installations WiFi.",
  },
  {
    href: "/wifi/offres",
    title: "Mes Offres",
    text: "Créez et gérez vos forfaits WiFi.",
  },
  {
    href: "/wifi/acces",
    title: "Mes Acces",
    text: "Generation et gestion des tickets WiFi.",
  },
];

export default function WifiPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mb-10">
        <h1 className="text-4xl font-black">Gestion WiFi</h1>
        <p className="mt-2 text-slate-400">
          Gerez vos reseaux, offres et acces WiFi.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition hover:border-cyan-300">
              <h2 className="text-2xl font-bold">{link.title}</h2>
              <p className="mt-3 text-slate-400">{link.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
