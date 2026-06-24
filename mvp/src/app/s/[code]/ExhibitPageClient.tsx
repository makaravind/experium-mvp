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
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col gap-8">
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
