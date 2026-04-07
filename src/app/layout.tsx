import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "KET Platform - Luyện thi Tiếng Anh Chuyên nghiệp",
  description:
    "Nền tảng ôn luyện và thi thử KET hiệu quả, vui nhộn theo phong cách học tập chủ động.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full font-nunito bg-background"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
