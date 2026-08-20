"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    setIsInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent) && !standalone);
    const onBeforeInstallPrompt = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    navigator.serviceWorker?.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (isInstalled) return null;

  async function install() {
    if (isIos) { setShowIosHelp(true); return; }
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <div className="relative">
      <button type="button" onClick={install} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#73bdb0] bg-white px-6 py-3.5 text-sm font-bold text-[#0a6f61] shadow-sm hover:border-[#0a6f61] hover:bg-[#f0f8f5]">
        <Download size={17} /> Installer l’application
      </button>
      {showIosHelp && (
        <div className="absolute left-0 top-full z-20 mt-3 w-72 rounded-xl border border-[#cfe0da] bg-white p-4 text-left text-sm text-[#405852] shadow-xl">
          <button type="button" onClick={() => setShowIosHelp(false)} className="float-right text-[#657771]" aria-label="Fermer"><X size={16} /></button>
          <p className="pr-4 font-bold text-[#173a34]">Installer sur iPhone</p>
          <p className="mt-2 leading-6">Dans Safari, touchez <Share2 size={14} className="mx-1 inline" /> Partager, puis « Sur l’écran d’accueil » et « Ajouter ».</p>
        </div>
      )}
    </div>
  );
}

