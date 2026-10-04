import type { Metadata, Viewport } from "next";
import { Figtree, Literata } from "next/font/google";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// The interface face. DESIGN.md decides the real pair; these are placeholders.
const sans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Page titles only (the `page-title` utility in globals.css).
const display = Literata({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "__APP_NAME__",
  description: "__APP_DESCRIPTION__",
  // A signed-in tool, not a website: nothing here is for search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Shrink the layout viewport when the on-screen keyboard opens, so 100dvh
  // means the part of the screen the keyboard is not covering and a dialog's
  // submit button never hides under it.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <Toaster position="bottom-left" richColors closeButton />
      </body>
    </html>
  );
}
