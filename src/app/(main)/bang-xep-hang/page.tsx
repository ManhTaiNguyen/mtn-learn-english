"use client";

import React, { useEffect, useState } from "react";
import { 
  Trophy, 
  Medal, 
  User as UserIcon,
  Search,
  ChevronRight,
  Flame,
  Zap,
  Loader2
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (json.status === "success") {
          setLeaderboard(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError("Không thể tải bảng xếp hạng.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return { icon: Trophy, bg: "bg-duo-yellow", border: "border-duo-yellow", text: "text-white" };
      case 2: return { icon: Medal, bg: "bg-slate-200", border: "border-slate-300", text: "text-slate-600" };
      case 3: return { icon: Medal, bg: "bg-orange-100", border: "border-orange-200", text: "text-orange-600" };
      default: return { icon: null, bg: "bg-gray-50", border: "border-duo-gray", text: "text-gray-400" };
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-10">
      <div className="text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-duo-yellow rounded-full flex items-center justify-center shadow-lg border-2 border-orange-200">
          <Trophy className="w-9 h-9 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-duo-text tracking-tighter uppercase">Bảng xếp hạng</h1>
          <p className="text-gray-400 font-bold mt-2">Dẫn đầu bảng vàng, nhận ngàn ưu đãi!</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-duo-yellow animate-spin" />
            <p className="text-gray-400 font-bold italic tracking-wide">Đang cập nhật thứ hạng...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white border-2 border-duo-gray rounded-3xl p-12 text-center">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Hiện chưa có học viên nào ghi bảng.</p>
          </div>
        ) : (
          leaderboard.map((item) => {
            const style = getRankStyle(item.rank);
            const Icon = style.icon;

            return (
              <div 
                key={item.id}
                className={cn(
                  "flex items-center gap-6 p-5 rounded-3xl border-2 bg-white transition-all",
                  item.rank <= 3 ? `${style.border} border-b-8` : "border-duo-gray border-b-4 hover:border-duo-blue"
                )}
              >
                {/* Rank Badge */}
                <div className={cn(
                  "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl",
                  style.bg,
                  style.text
                )}>
                  {Icon ? <Icon className="w-7 h-7" /> : item.rank}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-4 flex-1 truncate">
                  <div className="w-12 h-12 rounded-full border-2 border-duo-gray overflow-hidden shrink-0">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center text-duo-blue">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-black text-duo-text text-lg uppercase tracking-tight truncate">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                      {item.role === 'admin' ? 'CHỦ NHIỆM' : 'HỌC VIÊN'}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-6 h-6 text-duo-blue fill-duo-blue" />
                    <span className="text-2xl font-black text-duo-blue tabular-nums">
                      {item.xp}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kinh nghiệm (XP)</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 p-10 bg-slate-50 border-2 border-dashed border-duo-gray rounded-3xl text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-white border-2 border-duo-gray rounded-full flex items-center justify-center">
          <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
        </div>
        <p className="text-gray-500 font-bold max-w-md">
          Chăm chỉ luyện tập mỗi ngày để tích lũy XP và cơ hội nhận được các phần quà đặc biệt từ KET Platform!
        </p>
      </div>
    </div>
  );
}
