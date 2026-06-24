import { exhibits, allCodes } from "@/data/exhibits";
import ExhibitPageClient from "./ExhibitPageClient";

export function generateStaticParams() {
  return allCodes.map((code) => ({ code }));
}

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ExhibitPage({ params }: Props) {
  const { code } = await params;
  const exhibit = exhibits[code.toUpperCase()];

  if (!exhibit) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="font-display text-2xl text-ink mb-2">Exhibit not found</p>
        <p className="text-graphite text-sm">
          This QR code doesn&apos;t match any exhibit in our system.
        </p>
      </main>
    );
  }

  return <ExhibitPageClient exhibit={exhibit} />;
}
