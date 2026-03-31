import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: {
    default: "M'Bari — Nigerian Box Office & African Cinema",
    template: "%s | M'Bari",
  },
  description:
    "Live Nigerian box office charts, Nollywood film scores, African cinema discovery and events in Lagos, Nairobi, Accra and Johannesburg.",
  keywords: [
    "Nigerian box office",
    "Nollywood",
    "African cinema",
    "Nigerian films",
    "box office Nigeria",
    "African film scores",
  ],
  metadataBase: new URL("https://mbari.art"),
  openGraph: {
    title: "M'Bari — Nigerian Box Office & African Cinema",
    description:
      "Live Nigerian box office charts, Nollywood film scores, and events across Africa.",
    url: "https://mbari.art",
    siteName: "M'Bari",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "M'Bari — Nigerian Box Office & African Cinema",
    description:
      "Live Nigerian box office charts, Nollywood film scores, and events across Africa.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main style={{ paddingTop: "68px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
