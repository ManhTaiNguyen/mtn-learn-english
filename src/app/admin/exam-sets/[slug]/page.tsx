"use client";

import React, { useEffect, useState, use } from "react";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Layout,
  BookOpen,
  Headphones,
  PenTool,
  Settings,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import QuestionEditor from "@/components/admin/QuestionEditor";

const SKILL_ICONS: any = {
  READING: BookOpen,
  LISTENING: Headphones,
  WRITING: PenTool
};

export default function ExamSetEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [examSet, setExamSet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"SETTINGS" | "CONTENT">("CONTENT");
  const [selectedItem, setSelectedItem] = useState<{ type: "SET" | "EXAM" | "PART" | "QUESTION", id: number | string } | null>({ type: "SET", id: "root" });

  useEffect(() => {
    fetchSetData();
  }, [slug]);

  const fetchSetData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/exam-sets/${slug}`);
      const json = await res.json();
      if (json.status === "success") {
        setExamSet(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/exam-sets/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examSet.title,
          is_published: examSet.is_published
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        alert("Đã lưu thành công!");
      }
    } catch (err) {
      alert("Lỗi khi lưu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
      <p className="text-slate-400 font-bold italic tracking-wide">Đang nạp dữ liệu bộ đề...</p>
    </div>
  );

  if (!examSet) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Không tìm thấy bộ đề.</h2>
      <Link href="/admin/exam-sets">
        <Button variant="outline" className="mt-4">Quay lại danh sách</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/exam-sets">
            <button title="Quay lại" className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Chỉnh sửa: {examSet.title}
            </h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-0.5 italic">/{examSet.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/practice/${examSet.slug}`} target="_blank">
            <Button variant="outline" className="gap-2 border-slate-200">
              <Eye className="w-4 h-4" />
              XEM THỬ
            </Button>
          </Link>
          <Button 
            variant="blue" 
            className="gap-2 shadow-lg shadow-blue-100"
            disabled={isSaving}
            onClick={handleSaveBasic}
          >
            <Save className="w-4 h-4" />
            {isSaving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Tree sidebar */}
        <div className="w-full lg:w-80 shrink-0 bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-sm h-fit sticky top-24">
          <div className="flex items-center gap-2 px-2 pb-4 border-b-2 border-slate-50 mb-4">
            <Layout className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấu trúc bộ đề</span>
          </div>

          <div className="space-y-1">
            {/* Root: Exam Set Settings */}
            <button
              onClick={() => setSelectedItem({ type: "SET", id: "root" })}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                selectedItem?.type === "SET" ? "bg-slate-800 text-white" : "hover:bg-slate-50 text-slate-500"
              )}
            >
              <Settings className="w-4 h-4" />
              Thiết lập chung
            </button>

            {/* Exams list */}
            {examSet.exams.map((exam: any) => {
              const Icon = SKILL_ICONS[exam.skill_type] || BookOpen;
              const isExamSelected = selectedItem?.type === "EXAM" && selectedItem.id === exam.id;
              
              return (
                <div key={exam.id} className="space-y-1">
                  <button
                    onClick={() => setSelectedItem({ type: "EXAM", id: exam.id })}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all group mt-2",
                      isExamSelected ? "bg-blue-50 text-duo-blue" : "hover:bg-slate-50 text-slate-500"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {exam.skill_type}
                    </div>
                    <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", isExamSelected && "opacity-100")} />
                  </button>

                  {/* Parts within Exam */}
                  <div className="pl-4 space-y-1 border-l-2 border-slate-50 ml-6 mt-1">
                    {exam.parts.map((part: any, pIdx: number) => {
                      const isPartSelected = selectedItem?.type === "PART" && selectedItem.id === part.id;
                      return (
                        <button
                          key={part.id}
                          onClick={() => setSelectedItem({ type: "PART", id: part.id })}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            isPartSelected ? "bg-slate-100 text-slate-800" : "hover:bg-slate-50 text-slate-400"
                          )}
                        >
                          <div className="w-1 h-4 bg-slate-200 rounded-full shrink-0" />
                          Phần {part.order_index || pIdx + 1}
                        </button>
                      );
                    })}
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-slate-300 hover:text-duo-blue uppercase tracking-widest mt-1">
                      <Plus className="w-3 h-3" /> THÊM PHẦN
                    </button>
                  </div>
                </div>
              );
            })}
            
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs text-duo-blue bg-blue-50/50 hover:bg-blue-50 transition-all uppercase tracking-widest mt-4">
              <Plus className="w-4 h-4" /> THÊM BÀI THI KỸ NĂNG
            </button>
          </div>
        </div>

        {/* Right Editor Content */}
        <div className="flex-1 space-y-8">
          {selectedItem?.type === "SET" && (
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-black text-slate-800 tracking-tight pb-4 border-b-2 border-slate-50">Thiết lập bộ đề thi</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề (Tên hiển thị)</label>
                  <input
                    type="text"
                    title="Tiêu đề bộ đề"
                    placeholder="Nhập tiêu đề..."
                    value={examSet.title}
                    onChange={(e) => setExamSet({ ...examSet, title: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái bộ đề</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setExamSet({ ...examSet, is_published: true })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                        examSet.is_published 
                          ? "bg-green-50 border-green-200 text-green-600 shadow-sm" 
                          : "border-slate-100 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" /> ĐÃ XUẤT BẢN
                    </button>
                    <button
                      onClick={() => setExamSet({ ...examSet, is_published: false })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-4 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                        !examSet.is_published 
                          ? "bg-orange-50 border-orange-100 text-orange-500 shadow-sm" 
                          : "border-slate-100 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <AlertCircle className="w-4 h-4" /> BẢN NHÁP (DRAFT)
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">Lưu ý khi xuất bản</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Bộ đề sẽ chỉ hiển thị công khai trên trang chủ học viên khi trạng thái là "Đã xuất bản". Bạn nên hoàn thiện tất cả các phần thi và câu hỏi trước khi Public.</p>
                </div>
              </div>
            </div>
          )}

          {selectedItem?.type === "EXAM" && (
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm space-y-8 animate-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-center pb-4 border-b-2 border-slate-50">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Kỹ năng: {examSet.exams.find((e: any) => e.id === selectedItem.id)?.skill_type}</h2>
                  <Button variant="outline" size="sm" className="text-duo-red hover:bg-red-50 hover:border-red-200">XÓA KỸ NĂNG</Button>
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian làm bài (Phút)</label>
                    <input
                      type="number"
                      title="Thời gian làm bài"
                      placeholder="Số phút..."
                      defaultValue={Math.floor(examSet.exams.find((e: any) => e.id === selectedItem.id)?.duration_sec / 60)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700"
                    />
                  </div>
               </div>

               <div className="bg-blue-50/30 p-8 rounded-3xl border-2 border-dashed border-blue-100 text-center">
                  <p className="text-slate-400 font-bold mb-4 italic">Hãy chọn hoặc thêm "Phần thi" (Part) ở danh sách bên trái để bắt đầu nhập câu hỏi.</p>
                  <Button variant="blue" className="gap-2">
                    <Plus className="w-5 h-5" /> THÊM PHẦN THI MỚI
                  </Button>
               </div>
            </div>
          )}

          {selectedItem?.type === "PART" && (
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center pb-4 border-b-2 border-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    Chỉnh sửa Phần: {examSet.exams.flatMap((e: any) => e.parts).find((p: any) => p.id === selectedItem.id)?.order_index}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-duo-red hover:bg-red-50 hover:border-red-200">XÓA PHẦN NÀY</Button>
                </div>
              </div>

              {/* Questions within Part */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Danh sách câu hỏi</h3>
                
                {examSet.exams.flatMap((e: any) => e.parts).find((p: any) => p.id === selectedItem.id)?.questions.map((q: any, qIdx: number) => (
                  <div key={q.id} className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-500">
                          {q.order_index}
                        </div>
                        <span className="font-black text-slate-800 uppercase text-xs tracking-wider">{q.type}</span>
                      </div>
                      <button title="Xóa câu hỏi" className="text-slate-400 hover:text-duo-red transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-50 shadow-inner">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dữ liệu JSON (Data JSON)</p>
                       <pre className="text-[10px] font-mono text-slate-500 bg-slate-50 p-4 rounded-lg overflow-x-auto">
                         {JSON.stringify(q.data_json, null, 2)}
                       </pre>
                    </div>
                    <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest py-2 border-slate-200">CHỈNH SỬA CHI TIẾT CÂU HỎI</Button>
                  </div>
                ))}

                <button title="Thêm câu hỏi" className="w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-300 hover:text-duo-blue hover:border-duo-blue hover:bg-blue-50/20 transition-all group">
                   <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-duo-blue">
                     <Plus className="w-6 h-6" />
                   </div>
                   <span className="font-black text-sm uppercase tracking-widest">Thêm câu hỏi mới vào phần này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
