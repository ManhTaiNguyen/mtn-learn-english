import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center p-4">
      <div className="mb-8 items-center flex flex-col">
        <Link href="/">
          <h1 className="text-4xl font-black text-duo-green tracking-tighter">
            KET Platform
          </h1>
        </Link>
        <p className="text-gray-400 font-bold mt-2">Học vui vẻ, thi hiệu quả.</p>
      </div>
      
      <div className="w-full max-w-md bg-white border-2 border-duo-gray rounded-3xl p-8 shadow-sm">
        {children}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm font-bold text-gray-400">
          Chính sách bảo mật & Điều khoản sử dụng
        </p>
      </div>
    </div>
  );
}
