"use client";

import { useEffect, useState } from "react";

function BadgeSVG() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="70" cy="70" r="65" fill="#FFD93D" />
      <circle cx="70" cy="70" r="58" fill="#FFF3B0" />
      <circle cx="70" cy="70" r="52" fill="#4CAF50" />

      {/* Leaf icon */}
      <path
        d="M70 40c-15 5-25 20-25 35 5 0 15-3 25-15 10 12 20 15 25 15 0-15-10-30-25-35z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      <path
        d="M70 45v30"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Star accents */}
      <circle cx="38" cy="48" r="3" fill="#FFD93D" />
      <circle cx="102" cy="48" r="3" fill="#FFD93D" />
      <circle cx="70" cy="28" r="2.5" fill="#FFD93D" />

      {/* Bottom banner */}
      <path
        d="M40 105 L50 95 L90 95 L100 105 L95 115 L45 115 Z"
        fill="#FF6B35"
      />
      <text
        x="70"
        y="110"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="bold"
        fontFamily="Inter, sans-serif"
      >
        FIRST FIND
      </text>
    </svg>
  );
}

function Confetti() {
  const [particles, setParticles] = useState<
    { x: number; y: number; color: string; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    const colors = [
      "#FFD93D",
      "#4CAF50",
      "#FF6B35",
      "#2196F3",
      "#E91E63",
      "#9C27B0",
    ];
    const newParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: 4 + Math.random() * 6,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `-10%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

interface FirstDiscoveryBadgeProps {
  visible: boolean;
  onClose: () => void;
}

export default function FirstDiscoveryBadge({
  visible,
  onClose,
}: FirstDiscoveryBadgeProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="relative bg-paper rounded-[9px] p-8 max-w-sm w-full text-center overflow-hidden animate-badge-pop">
        <Confetti />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <p className="text-graphite text-sm font-medium uppercase tracking-wide">
            Badge Earned
          </p>

          <BadgeSVG />

          <h2 className="font-display text-2xl font-semibold text-ink">
            First Discovery!
          </h2>

          <p className="text-ink text-sm font-medium mt-2">
            Great start! Find your next plant nearby.
          </p>

          <div className="w-full bg-bone rounded-[9px] p-4 mt-2">
            <p className="text-graphite text-xs uppercase tracking-wide mb-2">
              What&apos;s next
            </p>
            <p className="text-ink text-sm">
              49 more plants are waiting to be discovered. Look for QR codes on
              nearby plant plates!
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full bg-ink text-paper py-3 rounded-buttons font-medium text-sm"
          >
            Keep Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
