import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  LockKeyhole,
  Network,
  Settings,
  UserPlus,
  Wifi,
} from "lucide-react";

const services = [
  { icon: Settings, label: "Maintenance informatique" },
  { icon: Network, label: "Reseaux informatiques" },
  { icon: Camera, label: "Videosurveillance" },
  { icon: Wifi, label: "Zones WiFi" },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3f7] px-4 py-8 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-1 bg-cyan-500" />
      <div className="absolute -left-24 top-20 h-64 w-64 rounded-full border border-cyan-200/60" />
      <div className="absolute -right-28 bottom-12 h-72 w-72 rounded-full border border-slate-300/70" />

      <section className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
        <div className="px-6 pb-6 pt-7 sm:px-9">
          <div className="mx-auto w-full max-w-[330px]">
            <Image
              src="/logo-test.png"
              alt="CyberCanvas Services"
              width={1000}
              height={259}
              priority
              className="h-auto w-full"
            />
          </div>

          <p className="mx-auto mt-6 max-w-md text-center text-sm font-medium leading-6 text-slate-600">
            Installation, maintenance et configuration de reseaux
            informatiques, zones WiFi et cameras de surveillance. Gestion et
            vente securisee de tickets WiFi via portail captif.
          </p>

          <div className="my-5 flex justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-cyan-300">
              <Wifi size={20} />
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="flex min-h-12 items-center justify-center gap-3 rounded-lg bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
            >
              <LockKeyhole size={19} />
              Connexion
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/register"
              className="flex min-h-12 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 font-black text-slate-900 hover:border-cyan-500 hover:bg-cyan-50"
            >
              <UserPlus size={19} />
              Inscription
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-[#f8fafc] px-5 py-4 sm:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.label}
                className="flex min-h-20 flex-col items-center justify-center gap-2 border-r border-slate-200 px-2 text-center last:border-r-0"
              >
                <service.icon size={20} className="text-slate-700" />
                <span className="text-xs font-bold leading-4 text-slate-600">
                  {service.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs font-semibold text-slate-500">
          CyberCanvas Services · Lome, Togo
        </footer>
      </section>
    </main>
  );
}
