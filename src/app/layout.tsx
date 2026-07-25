import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JU Learning — Study Materials",
    template: "%s — JU Learning",
  },
  description:
    "Open source study materials for B.Tech students. Search notes, PYQs, lab manuals, and assignments across all branches.",
  metadataBase: new URL("https://julearning.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${plusJakartaSans.variable}`}>
      <body className="grain min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
