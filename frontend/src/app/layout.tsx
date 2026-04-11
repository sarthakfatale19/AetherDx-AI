import type { Metadata } from "next";
import { Inter, Outfit, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AetherDx AI — Predict Before You Feel",
  description:
    "Pre-Symptomatic Health Intelligence Platform. Predict the risk of Diabetes, Hypertension, and Anemia 30–60 days before symptoms become severe.",
  keywords: [
    "health AI",
    "predictive healthcare",
    "diabetes prediction",
    "hypertension risk",
    "anemia detection",
    "explainable AI",
  ],
};

import { AuthProvider } from "@/components/auth/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${notoDevanagari.variable}`}
    >
      <body className="min-h-screen bg-[#0D0D0D] text-[#F5F5F5] font-[family-name:var(--font-inter)] antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
