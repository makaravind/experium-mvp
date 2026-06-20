"use client";

import { useState } from "react";
import type { Plant, Language } from "@/data/plants";
import PlantCard from "@/components/PlantCard";
import AudioPlayer from "@/components/AudioPlayer";
import DiscoveryCounter from "@/components/DiscoveryCounter";
import LanguageSelector from "@/components/LanguageSelector";

interface Props {
  plant: Plant;
}

export default function PlantPageClient({ plant }: Props) {
  const [audioEnded, setAudioEnded] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  const audioSrc = plant.audio[language] || plant.audio.en || "";

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col gap-8">
      <PlantCard plant={plant} />
      <div className="flex flex-col gap-6">
        <LanguageSelector selected={language} onChange={setLanguage} />
        <AudioPlayer
          key={audioSrc}
          src={audioSrc}
          onEnded={() => setAudioEnded(true)}
        />
      </div>
      <DiscoveryCounter plantCode={plant.code} visible={audioEnded} />
    </main>
  );
}
