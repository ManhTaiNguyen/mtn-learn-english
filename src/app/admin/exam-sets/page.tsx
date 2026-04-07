"use client";

import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock,
  Loader2
} from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ExamSetsAdminPage() {
  const [examSets, setExamSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newSet, setNewSet] = useState({ title: "", slug: "" });

  useEffect(() => {
    fetchExamSets();
  }, []);

  const fetchExamSets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/exam-sets");
      const json = await res.json();
      if (json.status === "success") setExamSets(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/exam-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSet)
      });
      const json = await res.json();
      if (json.status === "success") {
        setNewSet({ title: "", slug: "" });
        setIsCreating(false);
        fetchExamSets();
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert("Lỗi khi tạo bộ đề.");
    }
  };

  const filteredSets = examSets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý Bộ đề thi</h1>
          <p className="text-slate-500 font-bold">Danh sách tất cả các bộ đề thi KET trên hệ thống.</p>
        </div>
        <Button 
          variant="blue" 
          className="gap-2 shadow-lg shadow-blue-100"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-5 h-5" />
          TẠO BỘ ĐỀ MỚI
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tiêu đề hoặc slug..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-bold text-slate-600"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none py-3 gap-2">
            <Filter className="w-4 h-4" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
          <p className="text-slate-400 font-bold italic tracking-wide">Đang tải danh sách...</p>
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
          <p className="text-slate-400 font-black uppercase tracking-widest">Không tìm thấy bộ đề nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <div 
              key={set.id}
              className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm hover:border-slate-300 transition-all group flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  set.is_published ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                )}>
                  {set.is_published ? "ĐÃ XUẤT BẢN" : "BẢN NHÁP"}
                </div>
                <button title="Tùy chọn" className="text-slate-300 hover:text-slate-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800 leading-tight truncate-2-lines">
                  {set.title}
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1 tracking-wider uppercase font-mono">
                  /{set.slug}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mt-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {set._count.exams} Kỹ năng
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {new Date(set.created_at).toLocaleDateString("vi-VN")}
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <Link href={`/admin/exam-sets/${set.slug}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2 border-slate-200 hover:bg-slate-50 py-3">
                    <Edit3 className="w-4 h-4" />
                    CHỈNH SỬA
                  </Button>
                </Link>
                <Link href={`/practice/${set.slug}`} className="shrink-0" target="_blank">
                  <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 py-3">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tạo bộ đề mới</h2>
              <p className="text-slate-500 font-bold text-sm">Điền thông tin cơ bản để bắt đầu soạn thảo đề thi.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bộ đề</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: KET Cambridge Test 05"
                  value={newSet.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    setNewSet({ ...newSet, title, slug });
                  }}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-2xl py-3 px-4 outline-none font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Slug (Đường dẫn)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm italic">/</span>
                  <input 
                    type="text" 
                    required
                    placeholder="ket-cambridge-05"
                    value={newSet.slug}
                    onChange={(e) => setNewSet({ ...newSet, slug: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-2xl py-3 pl-8 pr-4 outline-none font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 py-4"
                  onClick={() => setIsCreating(false)}
                >
                  HỦY BỎ
                </Button>
                <Button 
                  type="submit" 
                  variant="blue" 
                  className="flex-1 py-4"
                >
                  TẠO NGAY
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
