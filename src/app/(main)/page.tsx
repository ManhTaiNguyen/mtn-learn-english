"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  MapPin, 
  Search, 
  Filter,
  Flame,
  Zap,
  Target,
  Plus
} from "lucide-react";
import ExamSetCard from "@/components/practice/ExamSetCard";
import Button from "@/components/ui/Button";

export default function Home() {
  const [examSets, setExamSets] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchExamSets() {
      try {
        const res = await fetch("/api/exam-sets");
        const json = await res.json();
        if (json.status === "success") {
          setExamSets(json.data);
        } else {
          setError(json.message || "Không thể tải danh sách bộ đề.");
        }
      } catch (err) {
        console.error("Failed to fetch exam sets:", err);
        setError("Đã có lỗi xảy ra khi kết nối máy chủ.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchExamSets();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header section with stats on mobile, etc. */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-duo-text tracking-tight">
          Lộ trình học tập của bạn
        </h1>
        <p className="text-gray-500 font-bold">
          Chinh phục chứng chỉ A2 Key (KET) từng bước một.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-800">
        <div className="bg-white border-2 border-duo-gray rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-orange-500">1</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày học liên tiếp</p>
          </div>
        </div>

        <div className="bg-white border-2 border-duo-gray rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Zap className="w-8 h-8 text-duo-blue fill-duo-blue" />
          </div>
          <div>
            <p className="text-2xl font-black text-duo-blue">0</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Điểm kinh nghiệm</p>
          </div>
        </div>

        <div className="bg-white border-2 border-duo-gray rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Target className="w-8 h-8 text-duo-green" />
          </div>
          <div>
            <p className="text-2xl font-black text-duo-green">0%</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Độ chính xác trung bình</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-2xl font-black text-duo-text tracking-tight">
          Bộ đề chuẩn Cambridge
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Lọc
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="w-4 h-4" />
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* Exam Sets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-3xl border-2 border-duo-gray" />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 border-2 border-red-100 bg-red-50 rounded-3xl text-center">
          <p className="text-red-500 font-bold">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {examSets.map((set) => (
            <ExamSetCard 
              key={set.id}
              title={set.title}
              slug={set.slug}
              examCount={set.examCount}
              isCompleted={set.isCompleted}
            />
          ))}
        </div>
      )}

      {/* Unlock Next Section */}
      <div className="mt-8 p-8 border-2 border-dashed border-duo-gray rounded-3xl flex flex-col items-center text-center gap-4 bg-gray-50/50">
        <div className="w-16 h-16 rounded-full bg-white border-2 border-duo-gray flex items-center justify-center shadow-sm">
          <Plus className="w-8 h-8 text-gray-300" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-400 uppercase tracking-wider">Sắp ra mắt</h3>
          <p className="text-gray-400 font-bold">Thêm nhiều bộ đề thi KET mới sẽ được cập nhật hàng tuần!</p>
        </div>
      </div>
    </div>
  );
}
