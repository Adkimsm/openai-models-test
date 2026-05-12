import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import DataBackup from "@/components/DataBackup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI 模型可用性测试",
  description: "测试 OpenAI 兼容 API 的模型可用性",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-gray-4 bg-gray-1 shrink-0 z-50 sticky top-0">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <Nav />
            <div className="flex items-center gap-0.5">
              <DataBackup />
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
