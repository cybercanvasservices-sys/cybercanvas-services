import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import PwaInstallButton from "@/components/PwaInstallButton";
import {
  ArrowUpRight,
  Camera,
  Check,
  ChevronRight,
  Headphones,
  Network,
  Router,
  ShieldCheck,
  ShoppingBag,
  Wifi,
} from "lucide-react";

const services = [
  {
    icon: Wifi,
    title: "Hotspots WiFi",
    text: "Déploiement de zones WiFi fiables avec portail captif et vente de tickets.",
  },
  {
    icon: Router,
    title: "Réseaux MikroTik",
    text: "Configuration, sécurisation et supervision de vos équipements réseau.",
  },
  {
    icon: Camera,
    title: "Vidéosurveillance",
    text: "Installation de caméras IP et solutions de surveillance pour vos locaux.",
  },
  {
    icon: Headphones,
    title: "Support technique",
    text: "Maintenance et assistance pour garder votre activité toujours connectée.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#10231f]">
      <header className="border-b border-[#dfe5e1] bg-white/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="CyberCanvas Services">
            <BrandLogo />
            <div className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-[#112d29]">CyberCanvas</span>
              <span className="block text-xs font-semibold tracking-[0.12em] text-[#59716b]">SERVICES</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#405852] md:flex">
            <a href="#services" className="hover:text-[#087f6d]">Services</a>
            <a href="#solution" className="hover:text-[#087f6d]">Notre solution</a>
            <Link href="/boutique" className="hover:text-[#087f6d]">Boutique</Link>
            <a href="#contact" className="hover:text-[#087f6d]">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg px-4 py-2.5 text-sm font-bold text-[#173a34] hover:bg-[#edf3f0] sm:inline-flex">
              Connexion
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-[#0a6f61] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#075b50]">
              Créer un compte <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#dfe5e1] bg-[#eef2ee]">
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[#123b35] lg:block" />
        <div className="relative mx-auto grid max-w-7xl items-stretch lg:grid-cols-[58%_42%]">
          <div className="px-5 py-20 sm:py-24 lg:px-8 lg:py-32">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#bcd1ca] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#0a6f61]">
              <span className="h-2 w-2 rounded-full bg-[#25a18e]" />
              Solutions réseau au Togo
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#10231f] sm:text-6xl">
              Votre réseau doit faire avancer votre activité.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#526861]">
              CyberCanvas Services installe, sécurise et gère vos réseaux WiFi, équipements MikroTik et systèmes de vidéosurveillance.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#102f2a] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#17463f]">
                Démarrer maintenant <ChevronRight size={18} />
              </Link>
              <a href="#services" className="inline-flex items-center justify-center rounded-lg border border-[#b8c6c1] bg-white px-6 py-3.5 text-sm font-bold text-[#173a34] hover:border-[#0a6f61]">
                Découvrir nos services
              </a>
            </div>
            <div className="mt-4">
              <PwaInstallButton />
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#526861]">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0a806e]" /> Installation professionnelle</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#0a806e]" /> Assistance locale</span>
            </div>
          </div>

          <div className="relative flex min-h-[430px] items-center bg-[#123b35] px-6 py-14 text-white lg:px-12">
            <div className="absolute right-0 top-0 h-40 w-40 border-b border-l border-white/10" />
            <div className="w-full">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8fd4c8]">Plateforme de gestion</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Pilotez vos offres WiFi simplement.</h2>
              <div className="mt-9 space-y-3">
                {["Création des offres et profils", "Import des tickets MikroTik", "Suivi des ventes et retraits"].map((item, index) => (
                  <div key={item} className="flex items-center gap-4 border-b border-white/12 py-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-[#a9e0d6]">0{index + 1}</span>
                    <span className="font-semibold text-white/90">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#a9e0d6] hover:text-white">
                Accéder à l’espace de gestion <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a7566]">Ce que nous faisons</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#10231f]">Une expertise complète, sur le terrain.</h2>
            <p className="mt-4 leading-7 text-[#5d706a]">Des solutions pensées pour les entreprises, commerces, hôtels et espaces publics.</p>
          </div>
          <div className="grid border-l border-t border-[#d9e1dd] sm:grid-cols-2">
            {services.map((service) => (
              <article key={service.title} className="border-b border-r border-[#d9e1dd] bg-white p-7 sm:p-8">
                <service.icon size={25} strokeWidth={1.8} className="text-[#0a7566]" />
                <h3 className="mt-7 text-lg font-bold text-[#17322d]">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#63756f]">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="boutique" className="border-y border-[#dfe5e1] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div className="flex gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#dcebe6] text-[#0a7566]"><ShoppingBag size={27} /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a7566]">Nouvelle boutique</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Équipements réseau et informatique</h2><p className="mt-3 max-w-2xl leading-7 text-[#5d706a]">Commandez vos routeurs MikroTik, points d’accès WiFi, câbles et accessoires. Paiement en ligne et livraison à Lomé et dans les environs.</p></div>
          </div>
          <Link href="/boutique" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a6f61] px-6 py-3.5 font-bold text-white hover:bg-[#075b50]">Visiter la boutique <ArrowUpRight size={18} /></Link>
        </div>
      </section>

      <section id="solution" className="bg-[#102f2a] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <Network size={30} className="text-[#8fd4c8]" />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Une infrastructure claire. Un suivi sans complication.</h2>
          </div>
          <div className="space-y-5 text-base leading-7 text-white/72">
            <p>Nous associons installation sur site et outils de gestion pour vous donner une vision simple de votre activité WiFi.</p>
            <p className="flex items-start gap-3 border-t border-white/15 pt-5"><ShieldCheck className="mt-0.5 shrink-0 text-[#8fd4c8]" size={21} /> Vos accès et données restent protégés dans un espace réservé.</p>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center lg:px-8">
          <div className="flex items-center gap-3"><BrandLogo /><span className="font-bold">CyberCanvas Services</span></div>
          <p className="text-sm text-[#657771]">Lomé, Togo · Solutions réseaux, WiFi et sécurité</p>
        </div>
      </footer>
    </main>
  );
}



