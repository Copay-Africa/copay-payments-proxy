import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Copay Payment Proxy",
  description: "Secure payment processing for Copay platform powered by IremboPay",
  keywords: ["payment", "copay", "irembopay", "secure", "rwanda"],
  authors: [{ name: "Copay Team" }],
  robots: "noindex, nofollow",
  other: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* IremboPay Payment Script */}
        <Script
          src={process.env.NEXT_PUBLIC_IREMBOPAY_CDN_URL || "https://dashboard.irembopay.com/assets/payment/inline.js"}
          strategy="beforeInteractive"
          id="irembopay-script"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
