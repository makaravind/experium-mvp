"use client";

import { useState } from "react";
import type { Plant, Language } from "@/data/plants";
import PlantCard from "@/components/PlantCard";
import AudioPlayer from "@/components/AudioPlayer";
import LanguageSelector from "@/components/LanguageSelector";
import FirstDiscoveryBadge from "@/components/FirstDiscoveryBadge";
import { getDiscovered } from "@/lib/discovery";

interface Props {
  plant: Plant;
}

export default function PlantPageClient({ plant }: Props) {
  const [audioEnded, setAudioEnded] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [showBadge, setShowBadge] = useState(false);

  const audioSrc = plant.audio[language] || plant.audio.en || "";

  function handleAudioEnded() {
    const previouslyDiscovered = getDiscovered();
    const isFirstEver =
      previouslyDiscovered.length === 0 ||
      (previouslyDiscovered.length === 1 &&
        previouslyDiscovered[0] === plant.code);

    setAudioEnded(true);

    if (isFirstEver) {
      setShowBadge(true);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col gap-8">
      <PlantCard plant={plant} />
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
