export type Language = "en" | "hi" | "te";

export interface Plant {
  code: string;
  name: string;
  scientificName: string;
  teaser: string;
  audio: Partial<Record<Language, string>>;
  imageSrc: string;
}

export const plants: Record<string, Plant> = {
  NM01: {
    code: "NM01",
    name: "Neem",
    scientificName: "Azadirachta indica",
    teaser:
      "Known as the village pharmacy, every part of this tree has been used in Indian medicine for over 4,000 years.",
    audio: { en: "/audio/neem-en.mp3", hi: "/audio/neem-hi.mp3" },
    imageSrc: "/images/neem.svg",
  },
  BN02: {
    code: "BN02",
    name: "Banyan",
    scientificName: "Ficus benghalensis",
    teaser:
      "A single Banyan can spread across acres using aerial roots that become new trunks — one tree becoming an entire forest.",
    audio: { en: "/audio/banyan-en.mp3", hi: "/audio/banyan-hi.mp3" },
    imageSrc: "/images/banyan.svg",
  },
  GM03: {
    code: "GM03",
    name: "Gulmohar",
    scientificName: "Delonix regia",
    teaser:
      "Originally from Madagascar, this flame tree travelled thousands of miles to paint Hyderabad's summers in blazing orange-red.",
    audio: { en: "/audio/gulmohar-en.mp3", hi: "/audio/gulmohar-hi.mp3" },
    imageSrc: "/images/gulmohar.svg",
  },
  BB04: {
    code: "BB04",
    name: "Baobab",
    scientificName: "Adansonia digitata",
    teaser:
      "Called the Tree of Life in Africa, the Baobab can store up to 120,000 litres of water in its massive trunk — surviving droughts that kill everything else around it.",
    audio: { en: "/audio/baobab-en.mp3", hi: "/audio/baobab-hi.mp3" },
    imageSrc: "/images/baobab.jpg",
  },
};

export const allCodes = Object.keys(plants);
