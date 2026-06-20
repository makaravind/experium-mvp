import { plants, allCodes } from "@/data/plants";
import PlantPageClient from "./PlantPageClient";

export function generateStaticParams() {
  return allCodes.map((code) => ({ code }));
}

interface Props {
  params: Promise<{ code: string }>;
}

export default async function PlantPage({ params }: Props) {
  const { code } = await params;
  const plant = plants[code.toUpperCase()];

  if (!plant) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="font-display text-2xl text-ink mb-2">Plant not found</p>
        <p className="text-graphite text-sm">
          This QR code doesn&apos;t match any plant in our system.
        </p>
      </main>
    );
  }

  return <PlantPageClient plant={plant} />;
}
