"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Calendar, Trophy, Zap, ChevronRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/dang-nhap");
    } else if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/user/history");
      const result = await res.json();
      if (result.status === "success") {
        setHistory(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-duo-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black text-duo-text tracking-tight">Lịch sử ôn luyện</h1>
        <p className="text-gray-500 font-bold">Xem lại kết quả các bài thi và ôn luyện bạn đã thực hiện.</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white border-2 border-duo-gray rounded-3xl p-12 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <h3 className="text-xl font-black text-duo-text tracking-tight">Chưa có lịch sử làm bài</h3>
            <p className="text-gray-400 font-bold mt-2">Bắt đầu ôn luyện ngay để theo dõi tiến trình của bạn!</p>
          </div>
          <Button variant="green" size="xl" onClick={() => router.push("/")}>
            BẮT ĐẦU NGAY
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-duo-gray rounded-3xl p-6 flex items-center justify-between group hover:border-duo-blue transition-all cursor-pointer shadow-sm"
              onClick={() => router.push(`/practice/result/${item.id}`)}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  item.mode === "EXAM" ? "bg-orange-100 text-orange-500" : "bg-blue-100 text-duo-blue"
                )}>
                  {item.mode === "EXAM" ? <Trophy className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                </div>
                
                <div className="flex flex-col">
                  <h3 className="font-black text-duo-text text-lg leading-tight uppercase tracking-tight">
                    {item.exam_title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-lg">
                      {item.skill_type}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">
                        {new Date(item.submitted_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">ĐIỂM SỐ</p>
                  <p className="text-2xl font-black text-duo-green">{item.score || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-duo-gray flex items-center justify-center group-hover:border-duo-blue group-hover:bg-blue-50 transition-all">
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-duo-blue" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
