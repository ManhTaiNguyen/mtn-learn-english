"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { User, Mail, Phone, ShieldCheck, Camera, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    avatar_url: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dang-nhap");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const result = await res.json();
      if (result.status === "success") {
        setProfile(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const result = await res.json();
      if (result.status === "success") {
        setMessage({ type: "success", text: "Đã cập nhật hồ sơ thành công!" });
      } else {
        setMessage({ type: "error", text: result.message || "Cập nhật thất bại." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Đã có lỗi xảy ra." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-duo-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-duo-text tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 font-bold">Quản lý thông tin và cài đặt tài khoản của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-duo-gray bg-gray-100 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <button 
              title="Thay đổi ảnh đại diện"
              className="absolute bottom-0 right-0 w-10 h-10 bg-white border-2 border-duo-gray rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-black text-duo-text">{profile.full_name || "Học viên"}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{(session?.user as any)?.role || "Learner"}</p>
          </div>
        </div>

        {/* Right column: Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border-2 border-duo-gray rounded-3xl p-6 lg:p-8 space-y-6">
            <div className="space-y-4 text-slate-800">
              <div className="space-y-2">
                <label className="text-sm font-black text-duo-text uppercase tracking-wider">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    title="Họ và tên"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full bg-[#f7f7f7] border-2 border-transparent focus:border-duo-blue rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-duo-text uppercase tracking-wider">Email (Không thể thay đổi)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    title="Email"
                    value={profile.email}
                    disabled
                    className="w-full bg-[#f1f1f1] border-2 border-transparent rounded-2xl py-3 pl-12 pr-4 outline-none font-bold text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-duo-text uppercase tracking-wider">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    title="Số điện thoại"
                    value={profile.phone_number}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    placeholder="Nhập số điện thoại"
                    className="w-full bg-[#f7f7f7] border-2 border-transparent focus:border-duo-blue rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={cn(
                  "p-4 rounded-2xl font-bold flex items-center gap-3",
                  message.type === "success" ? "bg-green-50 text-duo-green border-2 border-green-100" : "bg-red-50 text-red-500 border-2 border-red-100"
                )}
              >
                {message.type === "success" ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </motion.div>
            )}

            <div className="pt-4">
              <Button type="submit" variant="blue" size="xl" className="w-full" disabled={saving}>
                {saving ? "ĐANG LƯU..." : "CẬP NHẬT HỒ SƠ"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
