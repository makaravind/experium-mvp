"use client";

import { useEffect, useState } from "react";
import { getDiscovered, markDiscovered } from "@/lib/discovery";

const TOTAL_PLANTS = 50;

interface DiscoveryCounterProps {
  plantCode: string;
  visible: boolean;
}

export default function DiscoveryCounter({
  plantCode,
  visible,
}: DiscoveryCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const discovered = markDiscovered(plantCode);
    setCount(discovered.length);
  }, [plantCode]);

  if (!visible) return null;

  const nudge =
    count === 1
      ? "Great start! Find your next plant nearby."
      : count < 5
        ? "Keep exploring! Each plant has a unique story."
        : "You're a nature explorer! Keep discovering.";

  return (
    <div className="w-full bg-bone rounded-[9px] p-6 text-center">
      <p className="font-display text-2xl font-medium text-ink">
        {count} of {TOTAL_PLANTS}
      </p>
      <p className="text-graphite text-sm mt-1">plants discovered</p>
      <p className="text-ink text-sm mt-4 font-medium">{nudge}</p>
    </div>
  );
}
