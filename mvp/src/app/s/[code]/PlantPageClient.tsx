"use client";

import { useState } from "react";
import type { Plant } from "@/data/plants";
import PlantCard from "@/components/PlantCard";
import AudioPlayer from "@/components/AudioPlayer";
import DiscoveryCounter from "@/components/DiscoveryCounter";

interface Props {
  plant: Plant;
}

export default function PlantPageClient({ plant }: Props) {
  const [audioEnded, setAudioEnded] = useState(false);

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto flex flex-col gap-8">
      <PlantCard plant={plant} />
      <AudioPlayer src={plant.audioSrc} onEnded={() => setAudioEnded(true)} />
      <DiscoveryCounter plantCode={plant.code} visible={audioEnded} />
    </main>
  );
}
