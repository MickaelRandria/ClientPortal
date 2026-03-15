import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ClientPortal",
    template: "%s · ClientPortal",
  },
  description:
    "Déposez vos fichiers, partagez votre brief et échangez avec votre équipe — tout au même endroit.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2334D399'/><path d='M9 16l5 5 9-9' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={plusJakartaSans.variable}>
      <body className="antialiased">
        {/* Ambient light circles */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-0"
          style={{
            top: "-80px",
            right: "-80px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.12)",
            filter: "blur(120px)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-0"
          style={{
            bottom: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(67, 56, 202, 0.08)",
            filter: "blur(120px)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-0"
          style={{
            top: "40%",
            right: "20%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(124, 58, 237, 0.06)",
            filter: "blur(120px)",
          }}
        />

        {/* Page content */}
        <div className="relative z-10">{children}</div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
