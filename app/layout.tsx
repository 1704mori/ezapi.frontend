import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Messager - WhatsApp Business API Platform",
  description: "Professional WhatsApp messaging platform with device management, subscription billing, and analytics",
  keywords: ["WhatsApp", "Business API", "Messaging", "Automation", "CRM"],
  authors: [{ name: "Messager Team" }],
  openGraph: {
    title: "Messager - WhatsApp Business API Platform",
    description: "Professional WhatsApp messaging platform with device management, subscription billing, and analytics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
