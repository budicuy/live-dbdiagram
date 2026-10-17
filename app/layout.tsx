import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Live DB Diagram - Visual Database Designer",
  description:
    "Aplikasi lokal untuk merancang, memvisualisasikan, mengedit, mengimpor, dan mengekspor skema database MySQL dan PostgreSQL.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
