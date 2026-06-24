import type { Exhibit } from "@/data/exhibits";

interface ExhibitCardProps {
  exhibit: Exhibit;
}

export default function ExhibitCard({ exhibit }: ExhibitCardProps) {
  return (
    <div className="w-full">
      <div className="w-full aspect-[4/3] bg-ash rounded-[9px] overflow-hidden mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exhibit.imageSrc}
          alt={exhibit.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h1 className="font-display text-4xl font-medium tracking-tight text-ink">
        {exhibit.name}
      </h1>
      {exhibit.scientificName && (
        <p className="text-graphite text-sm italic mt-1">
          {exhibit.scientificName}
        </p>
      )}
      <p className="text-ink text-base leading-relaxed mt-4">{exhibit.teaser}</p>
    </div>
  );
}
