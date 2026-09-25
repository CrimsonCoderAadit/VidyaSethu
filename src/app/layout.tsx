import { LiteModeProvider } from "@/components/LiteMode";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Public_Sans, Zilla_Slab } from "next/font/google";
import { getLang } from "@/lib/lang";
import "./globals.css";

// Fonts are trimmed for 2G/3G: one weight for headings, two for body, and only the body face is
// preloaded. The others swap in when they arrive instead of competing with the HTML for bandwidth.
const display = Zilla_Slab({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600"],
  preload: false,
});

const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Vidya Setu — MoTA Scholarship & Fellowship Portal",
  description:
    "A configurable scholarship and fellowship administration portal for the Ministry of Tribal Affairs.",
  applicationName: "Vidya Setu",
  appleWebApp: { capable: true, title: "Vidya Setu", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f3a5f",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
        <LiteModeProvider>{children}</LiteModeProvider>
      </body>
    </html>
  );
}
