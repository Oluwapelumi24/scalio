import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ShapeDefs } from "@/components/site/ShapeDefs";
import { SITE_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display type for headlines: warm, slightly quirky, confident.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Veno — Opening soon. Join the waitlist.";
const DESCRIPTION =
  "Veno is opening soon in Lagos. Join the waitlist to book spas, salons, laundry, tailors and other local services, or to list your business.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Veno", url: "/", locale: "en_NG", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${serif.variable} antialiased`}>
      <body>
        <ShapeDefs />
        {children}
      </body>
    </html>
  );
}
