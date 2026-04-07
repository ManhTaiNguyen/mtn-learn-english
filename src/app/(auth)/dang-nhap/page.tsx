"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "ACCOUNT_LOCKED") {
          setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        } else {
          setError("Email hoặc mật khẩu không chính xác.");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-duo-text uppercase tracking-wider">Đăng nhập</h2>
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
              placeholder="Mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f7f7f7] border-2 border-duo-gray rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-duo-blue transition-all font-bold text-duo-text"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Link 
            href="/quen-mat-khau" 
            className="text-xs font-black text-duo-blue uppercase tracking-wider hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button 
          type="submit" 
          variant="blue" 
          size="xl" 
          disabled={loading}
          className="w-full mt-2"
        >
          {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
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
          Chưa có tài khoản?
        </p>
        <Link href="/dang-ky">
          <Button variant="outline" size="xl" className="w-full">
            ĐĂNG KÝ NGAY
          </Button>
        </Link>
      </div>
    </div>
  );
}
