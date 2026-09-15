import type { Metadata } from "next";
import { IBM_Plex_Mono, Public_Sans, Zilla_Slab } from "next/font/google";
import "./globals.css";

const display = Zilla_Slab({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Vidya Setu — MoTA Scholarship & Fellowship Portal",
  description:
    "A configurable scholarship and fellowship administration portal for the Ministry of Tribal Affairs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
