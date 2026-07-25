import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "TravelFlow Growth OS",
    template: "%s · TravelFlow Growth OS",
  },
  description:
    "Horizon Trails Travel demo workspace — lead intelligence, marketing analytics, automations, and AI copilot for travel consultants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${sourceSerif.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
