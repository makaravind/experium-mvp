import type { Plant } from "@/data/plants";

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  return (
    <div className="w-full">
      <div className="w-full aspect-[4/3] bg-ash rounded-[9px] overflow-hidden mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plant.imageSrc}
          alt={plant.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h1 className="font-display text-4xl font-medium tracking-tight text-ink">
        {plant.name}
      </h1>
      <p className="text-graphite text-sm italic mt-1">
        {plant.scientificName}
      </p>
      <p className="text-ink text-base leading-relaxed mt-4">{plant.teaser}</p>
    </div>
  );
}
