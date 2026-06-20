import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Nature Tour",
  description: "Discover the stories behind the plants at Experium Park",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Playfair+Display:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-putty font-body text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
