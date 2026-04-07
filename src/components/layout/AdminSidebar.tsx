"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Library, 
  Settings, 
  ArrowLeft,
  LayoutDashboard,
  PlusCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "TỔNG QUAN", icon: LayoutDashboard },
  { href: "/admin/exam-sets", label: "QUẢN LÝ BỘ ĐỀ", icon: Library },
  { href: "/admin/users", label: "NGƯỜI DÙNG", icon: Users },
  { href: "/admin/stats", label: "BÁO CÁO", icon: BarChart3 },
];

const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r-2 border-slate-200 bg-white px-4 py-6 flex flex-col z-50">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">
          KET ADMIN
        </h1>
        <div className="text-[10px] font-black text-duo-blue uppercase tracking-widest mt-1">
          Hệ thống Quản trị
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all",
                isActive 
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-200" 
                  : "hover:bg-slate-50 text-slate-500"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
              <span className="text-sm tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <Link 
          href="/"
          className="flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">VỀ TRANG CHỦ</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
