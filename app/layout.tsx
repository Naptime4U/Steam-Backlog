import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButton from "../components/AuthButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steam Backlog",
  description: "Organiza tu biblioteca de Steam, gestiona tu backlog y registra tus completados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#171a21] text-[#c7d5e0]`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#171a21] text-[#c7d5e0] transition-colors duration-300">
          <header className="w-full px-4 sm:px-8 py-3 sm:py-5 border-b border-[#23262e] bg-[#23262e] sticky top-0 z-20 flex items-center justify-between gap-2">
            <a href="/" className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#66c0f4] drop-shadow no-underline hover:text-[#8ecff7] transition-colors shrink-0" style={{textDecoration:'none'}}>Steam Backlog</a>
            <AuthButton />
          </header>
          <main className="flex-1 w-full max-w-screen-2xl mx-auto py-4 sm:py-8 flex flex-col gap-8 px-2 sm:px-4">
            {children}
          </main>
          <footer className="w-full px-8 py-4 border-t border-[#23262e] text-sm text-[#8f98a0] text-center bg-[#23262e]">
            Proyecto TFG &copy; {new Date().getFullYear()}
          </footer>
      </body>
    </html>
  );
}
