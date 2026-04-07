"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Giả lập gửi email (Tính năng này cần tích hợp Mail Service sau)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
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
          <h2 className="text-2xl font-black text-duo-text uppercase tracking-wider">Đã gửi yêu cầu!</h2>
          <p className="text-gray-400 font-bold mt-2">
            Một email hướng dẫn khôi phục mật khẩu đã được gửi đến <strong>{email}</strong>.
          </p>
        </div>
        <Link href="/dang-nhap" className="w-full">
          <Button variant="blue" size="xl" className="w-full">
            QUAY LẠI ĐĂNG NHẬP
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link 
        href="/dang-nhap" 
        className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-wider hover:text-duo-blue transition-colors w-fit underline-offset-4 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>

      <div className="text-center">
        <h2 className="text-2xl font-black text-duo-text uppercase tracking-wider">Quên mật khẩu?</h2>
        <p className="text-gray-400 font-bold mt-2 italic text-sm">
          Đừng lo lắng! Hãy nhập email của bạn và chúng tôi sẽ giúp bạn lấy lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email của bạn"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#f7f7f7] border-2 border-duo-gray rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-duo-blue transition-all font-bold text-duo-text"
          />
        </div>

        <Button 
          type="submit" 
          variant="blue" 
          size="xl" 
          disabled={loading}
          className="w-full mt-2"
        >
          {loading ? "ĐANG XỬ LÝ..." : "GỬI YÊU CẦU"}
        </Button>
      </form>
    </div>
  );
}
