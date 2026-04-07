"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const result = await res.json();

      if (result.status === "error") {
        setError(result.message || "Đăng ký thất bại.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dang-nhap");
        }, 2000);
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-12 h-12 text-duo-green" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black text-duo-text uppercase tracking-wider">Thành công!</h2>
          <p className="text-gray-400 font-bold mt-2">Tài khoản của bạn đã được tạo. Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-duo-text uppercase tracking-wider">Tạo tài khoản</h2>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-200 text-red-500 rounded-2xl p-4 flex items-center gap-3 text-sm font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Họ và tên"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#f7f7f7] border-2 border-duo-gray rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-duo-blue transition-all font-bold text-duo-text"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#f7f7f7] border-2 border-duo-gray rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-duo-blue transition-all font-bold text-duo-text"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Mật khẩu (tối thiểu 8 ký tự)"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f7f7f7] border-2 border-duo-gray rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-duo-blue transition-all font-bold text-duo-text"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          variant="green" 
          size="xl" 
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? "ĐANG XỬ LÝ..." : "TẠO TÀI KHOẢN"}
        </Button>
      </form>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-duo-gray"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 font-black text-gray-400">Hoặc</span>
        </div>
      </div>

      <div className="text-center flex flex-col gap-2">
        <p className="text-sm font-bold text-gray-400">
          Đã có tài khoản?
        </p>
        <Link href="/dang-nhap">
          <Button variant="outline" size="xl" className="w-full">
            ĐĂNG NHẬP
          </Button>
        </Link>
      </div>
    </div>
  );
}
