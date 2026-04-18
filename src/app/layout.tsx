import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FADE — 사후 체크리스트",
  description: "떠나기 전에, 그리고 떠난 뒤에 해야 할 일들을 정리하는 체크리스트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="min-h-screen flex">
          <Sidebar />
          <main className="flex-1 px-8 py-7 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
