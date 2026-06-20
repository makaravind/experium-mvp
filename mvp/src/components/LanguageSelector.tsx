"use client";

import type { Language } from "@/data/plants";

interface LanguageSelectorProps {
  selected: Language;
  onChange: (lang: Language) => void;
}

const languages: { code: Language; label: string; available: boolean }[] = [
  { code: "en", label: "EN", available: true },
  { code: "hi", label: "HI", available: true },
  { code: "te", label: "TE", available: false },
];

export default function LanguageSelector({
  selected,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {languages.map(({ code, label, available }) => (
        <button
          key={code}
          onClick={() => available && onChange(code)}
          disabled={!available}
          className={`relative px-4 py-2 rounded-[28.8px] text-sm font-medium transition-colors ${
            !available
              ? "bg-chalk text-ash cursor-not-allowed"
              : selected === code
                ? "bg-ink text-paper"
                : "bg-bone text-graphite"
          }`}
        >
          {label}
          {!available && (
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-ash whitespace-nowrap">
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
