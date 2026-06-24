"use client";

import { useEffect, useState } from "react";
import { getDiscovered, markDiscovered } from "@/lib/discovery";

const TOTAL_EXHIBITS = 50;

interface DiscoveryCounterProps {
  exhibitCode: string;
  visible: boolean;
}

export default function DiscoveryCounter({
  exhibitCode,
  visible,
}: DiscoveryCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const discovered = markDiscovered(exhibitCode);
    setCount(discovered.length);
  }, [exhibitCode]);

  if (!visible) return null;

  const nudge =
    count === 1
      ? "Great start! Find your next exhibit nearby."
      : count < 5
        ? "Keep exploring! Each exhibit has a unique story."
        : "You're a nature explorer! Keep discovering.";

  return (
    <div className="w-full bg-bone rounded-[9px] p-6 text-center">
      <p className="font-display text-2xl font-medium text-ink">
        {count} of {TOTAL_EXHIBITS}
      </p>
      <p className="text-graphite text-sm mt-1">exhibits discovered</p>
      <p className="text-ink text-sm mt-4 font-medium">{nudge}</p>
    </div>
  );
}
