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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1730] px-4 py-8 text-slate-900">
      <div className="absolute inset-y-0 left-0 w-[32%] bg-cyan-500" />
      <div className="absolute inset-y-0 right-0 w-[22%] bg-fuchsia-600" />
      <div className="absolute left-[22%] top-0 h-full w-px bg-white/20" />
      <div className="absolute right-[18%] top-0 h-full w-px bg-white/20" />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-2xl">
        <div className="px-6 pb-7 pt-8 sm:px-10">
          <div className="mx-auto w-full max-w-[390px]">
            <Image
              src="/logo-test.png"
              alt="CyberCanvas Services"
              width={1000}
              height={259}
              priority
              className="h-auto w-full"
            />
          </div>

          <p className="mx-auto mt-7 max-w-md text-center text-sm font-medium leading-6 text-slate-600">
            Installation, maintenance et configuration de reseaux
            informatiques, zones WiFi et cameras de surveillance. Gestion et
            vente securisee de tickets WiFi via portail captif.
          </p>

          <div className="my-6 flex justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700">
              <Wifi size={22} />
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-slate-950 px-5 py-3 font-black text-white hover:bg-slate-800"
            >
              <LockKeyhole size={19} />
              Connexion
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/register"
              className="flex min-h-14 items-center justify-center gap-3 rounded-lg bg-cyan-500 px-5 py-3 font-black text-slate-950 hover:bg-cyan-400"
            >
              <UserPlus size={19} />
              Inscription
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 sm:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.label}
                className="flex min-h-24 flex-col items-center justify-center gap-2 border-r border-slate-200 px-2 text-center last:border-r-0"
              >
                <service.icon size={22} className="text-cyan-700" />
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
