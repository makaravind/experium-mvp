"use client";

import { useState } from "react";
import type { Exhibit, Language } from "@/data/exhibits";
import ExhibitCard from "@/components/ExhibitCard";
import AudioPlayer from "@/components/AudioPlayer";
import LanguageSelector from "@/components/LanguageSelector";
import FirstDiscoveryBadge from "@/components/FirstDiscoveryBadge";
import { getDiscovered } from "@/lib/discovery";

interface Props {
  exhibit: Exhibit;
}

export default function ExhibitPageClient({ exhibit }: Props) {
  const [audioEnded, setAudioEnded] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [showBadge, setShowBadge] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  function handleReset() {
    localStorage.clear();
    window.location.reload();
  }

  const audioSrc = exhibit.audio[language] || exhibit.audio.en || "";

  function handleAudioEnded() {
    const previouslyDiscovered = getDiscovered();
    const isFirstEver =
      previouslyDiscovered.length === 0 ||
      (previouslyDiscovered.length === 1 &&
        previouslyDiscovered[0] === exhibit.code);

    setAudioEnded(true);

    if (isFirstEver) {
      setShowBadge(true);
    }
  }

  return (
    <main className="relative min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col gap-8">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-graphite hover:text-ink"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="4" r="2" />
            <circle cx="10" cy="10" r="2" />
            <circle cx="10" cy="16" r="2" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-1 bg-paper shadow-lg rounded-lg py-1 min-w-[140px]">
            <button
              onClick={handleReset}
              className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-bone"
            >
              Reset demo
            </button>
          </div>
        )}
      </div>
      <ExhibitCard exhibit={exhibit} />
      <div className="flex flex-col gap-6">
        <LanguageSelector selected={language} onChange={setLanguage} />
        <AudioPlayer
          key={audioSrc}
          src={audioSrc}
          onEnded={handleAudioEnded}
        />
      </div>
      <FirstDiscoveryBadge
        visible={showBadge}
        onClose={() => setShowBadge(false)}
      />
    </main>
  );
}
