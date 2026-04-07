import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "KET Platform | Luyện thi Tiếng Anh KET",
  description: "Nền tảng ôn luyện và thi thử KET hiệu quả, vui nhộn theo phong cách Duolingo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-fredoka">{children}</body>
    </html>
  );
}
