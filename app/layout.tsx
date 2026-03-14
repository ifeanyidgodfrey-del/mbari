import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "M'Bari — Where culture lives",
  description: "The canonical data layer for African culture. Film scoring, discovery, and data infrastructure for Nigerian and pan-African cinema.",
  openGraph: {
    title: "M'Bari — Where culture lives",
    description: "The canonical data layer for African culture.",
    url: "https://mbari.art",
    siteName: "M'Bari",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "M'Bari — Where culture lives",
    description: "The canonical data layer for African culture.",
  },
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
        <main style={{ paddingTop: "34px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
