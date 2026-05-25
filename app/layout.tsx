import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import CartDrawer from "@/components/shop/CartDrawer";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KurumKurum — Premium Himalayan Bites",
  description:
    "Premium Nepali & Himalayan snacks, shipped fresh across the USA. Shop authentic chips, noodles, sweets, and spices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} font-sans antialiased`}
        style={{ background: "#F7F4EB", color: "#2B2D2F" }}
      >
        {children}
        <CartDrawer />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#2B2D2F",
              color: "#F7F4EB",
              borderRadius: "8px",
            },
          }}
        />
      </body>
    </html>
  );
}
