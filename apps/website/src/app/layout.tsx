import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ShapeDefs } from "@/components/site/ShapeDefs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display type for headlines: warm, slightly quirky, confident.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veno — Book local services, or grow the business behind them",
  description:
    "Veno connects customers with trusted local service businesses — spas, laundromats, tailors, cleaners, photographers, salons and more — with real-time booking for customers and a full business toolkit for vendors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased`}>
      <body>
        <ShapeDefs />
        {children}
      </body>
    </html>
  );
}
