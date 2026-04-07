"use client";

import React, { useState, useEffect } from "react";
import { Save, X, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface QuestionEditorProps {
  question: any;
  onSave: (updatedQuestion: any) => void;
  onClose: () => void;
}

export default function QuestionEditor({ question, onSave, onClose }: QuestionEditorProps) {
  const [dataJson, setDataJson] = useState(JSON.stringify(question.data_json, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(dataJson);
      onSave({ ...question, data_json: parsed });
    } catch (err) {
      setError("Định dạng JSON không hợp lệ.");
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b-2 border-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Chỉnh sửa Câu hỏi #{question.order_index}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Loại: {question.type}</p>
          </div>
          <button title="Đóng" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dữ liệu Câu hỏi (JSON Editor)</label>
            <textarea
              title="Dữ liệu JSON"
              placeholder="Nhập JSON tại đây..."
              value={dataJson}
              onChange={(e) => {
                setDataJson(e.target.value);
                setError(null);
              }}
              className="flex-1 min-h-[400px] w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 font-mono text-sm outline-none focus:border-duo-blue transition-all"
              spellCheck={false}
            />
            {error && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
          </div>

          <div className="bg-blue-50/50 p-6 rounded-2xl border-2 border-blue-100">
             <h4 className="text-sm font-black text-duo-blue uppercase tracking-widest mb-2">Cấu trúc gợi ý cho {question.type}</h4>
             <p className="text-xs text-slate-500 leading-relaxed italic">
               Đảm bảo bạn nhập đúng cấu trúc các thuộc tính như `question`, `options`, `correct_answer`. Bạn có thể Copy-Paste từ các câu hỏi tương tự khác.
             </p>
          </div>
        </div>

        <div className="p-6 border-t-2 border-slate-50 bg-slate-50 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="px-8 border-slate-200">HỦY BỎ</Button>
          <Button variant="blue" onClick={handleSave} className="px-8 shadow-lg shadow-blue-100 gap-2">
            <Save className="w-4 h-4" /> CẬP NHẬT JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
