"use client";

import React, { useEffect, useState } from "react";
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  ChevronRight,
  Filter,
  Search,
  Loader2
} from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SKILLS = [
  { id: "READING", label: "Reading", icon: BookOpen, color: "text-duo-blue", bg: "bg-blue-50", border: "border-duo-blue" },
  { id: "LISTENING", label: "Listening", icon: Headphones, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-500" },
  { id: "WRITING", label: "Writing", icon: PenTool, color: "text-duo-green", bg: "bg-green-50", border: "border-duo-green" },
];

export default function PracticeSelectionPage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [examSets, setExamSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExamSets() {
      try {
        const res = await fetch("/api/exam-sets");
        const json = await res.json();
        if (json.status === "success") {
          setExamSets(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError("Không thể nạp dữ liệu.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchExamSets();
  }, []);

  const filteredSets = selectedSkill 
    ? examSets.filter(set => set.skills.includes(selectedSkill))
    : examSets;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-black text-duo-text tracking-tight">Khu vực Luyện tập</h1>
        <p className="text-gray-500 font-bold">Lựa chọn kỹ năng bạn muốn tập trung ôn luyện hôm nay.</p>
      </div>

      {/* Skill Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SKILLS.map((skill) => {
          const isActive = selectedSkill === skill.id;
          const Icon = skill.icon;
          
          return (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(isActive ? null : skill.id)}
              className={cn(
                "relative flex flex-col items-center gap-4 p-8 rounded-3xl border-2 transition-all group",
                isActive 
                  ? `${skill.border} ${skill.bg} border-b-8 translate-y-[-4px]` 
                  : "border-duo-gray hover:border-duo-blue hover:bg-gray-50 border-b-4"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                skill.bg,
                skill.color
              )}>
                <Icon className="w-10 h-10" />
              </div>
              <span className="text-xl font-black text-duo-text tracking-wider uppercase">
                {skill.label}
              </span>
              
              {isActive && (
                <div className={cn("absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg", skill.color.replace('text', 'bg'))}>
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-2xl font-black text-duo-text tracking-tight">
          {selectedSkill ? `Các bộ đề có kỹ năng ${selectedSkill}` : "Tất cả bộ đề ôn luyện"}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-duo-blue animate-spin" />
          <p className="text-gray-400 font-bold italic tracking-wide">Đang nạp danh sách bài tập...</p>
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-duo-gray rounded-3xl p-16 text-center">
          <p className="text-gray-400 font-bold uppercase tracking-widest">Không có dữ liệu phù hợp</p>
          <Button variant="outline" className="mt-4" onClick={() => setSelectedSkill(null)}>
            XÓA BỘ LỌC
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSets.map((set) => (
            <Link 
              key={set.id}
              href={`/practice/${set.slug}`}
              className="bg-white border-2 border-duo-gray border-b-8 rounded-3xl p-6 flex flex-col gap-4 hover:border-duo-blue hover:translate-y-[-2px] transition-all group"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black text-duo-text uppercase tracking-tight group-hover:text-duo-blue">
                  {set.title}
                </h3>
                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg uppercase">
                  {set.examCount} BÀI THI
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {set.skills.map((skill: string) => (
                  <span 
                    key={skill}
                    className="text-[10px] font-black text-white px-2 py-0.5 rounded-md uppercase"
                    style={{ backgroundColor: SKILLS.find(s => s.id === skill)?.color.replace('text-', '') || '#ccc' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4 flex items-center text-duo-blue font-black text-sm uppercase tracking-wider gap-2">
                Bắt đầu học ngay
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
