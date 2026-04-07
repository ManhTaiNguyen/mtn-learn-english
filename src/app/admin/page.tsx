"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Library, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(json => {
        if (json.status === "success") setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const stats = [
    { label: "Tổng học viên", value: data?.stats.users || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Bộ đề hiện có", value: data?.stats.exams || 0, icon: Library, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Lượt làm bài", value: data?.stats.submissions || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Tăng trưởng", value: "+12%", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8 text-slate-800">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Chào mừng trở lại, Admin!</h1>
        <p className="text-slate-500 font-bold">Dưới đây là tổng quan về hoạt động của hệ thống KET Platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b-2 border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Hoạt động gần đây</h2>
            <Link href="/admin/stats" className="text-duo-blue text-xs font-black uppercase tracking-wider flex items-center gap-1 hover:underline">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Đề thi</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Điểm</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {data?.recent_activity.map((activity: any) => (
                  <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{activity.user}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{activity.exam}</td>
                    <td className="px-6 py-4">
                      <span className="font-black text-green-600">{activity.score}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-bold">
                      {new Date(activity.at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-black leading-tight">Bạn muốn thêm nội dung mới?</h3>
              <p className="text-slate-300 text-sm font-medium">Tạo thêm các bộ đề thi KET chuẩn Cambridge để cung cấp tài liệu cho học viên.</p>
              <Link href="/admin/exam-sets/new" className="inline-block w-full">
                <button className="w-full bg-white text-slate-800 py-3 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors">
                  TẠO BỘ ĐỀ NGAY
                </button>
              </Link>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
          </div>

          <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black mb-4">Trạng thái hệ thống</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Database</span>
                <span className="text-green-500 font-black flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Ổn định
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">API Gateway</span>
                <span className="text-green-500 font-black flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Ổn định
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Auth Service</span>
                <span className="text-green-500 font-black flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Ổn định
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
