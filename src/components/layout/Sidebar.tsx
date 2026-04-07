"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  BookOpen, 
  Trophy, 
  User, 
  Settings,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "HỌC TẬP", icon: Home, color: "text-duo-green" },
  { href: "/luyen-tap", label: "LUYỆN TẬP", icon: Zap, color: "text-duo-blue" },
  { href: "/bang-xep-hang", label: "XẾP HẠNG", icon: Trophy, color: "text-duo-yellow" },
  { href: "/lich-su", label: "LỊCH SỬ", icon: Zap, color: "text-orange-500" },
  { href: "/ho-so", label: "HỒ SƠ", icon: User, color: "text-duo-red" },
  { href: "/admin", label: "QUẢN TRỊ", icon: ShieldCheck, color: "text-gray-500" },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 lg:w-64 border-r-2 border-duo-gray bg-white px-2 lg:px-4 py-6 flex flex-col z-50">
      <div className="mb-10 px-2 lg:px-4">
        <h1 className="text-2xl font-black text-duo-green hidden lg:block tracking-tighter">
          KET Platform
        </h1>
        <div className="w-10 h-10 bg-duo-green rounded-xl lg:hidden flex items-center justify-center text-white font-bold">
          K
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-2xl font-bold transition-all group",
                isActive 
                  ? "bg-blue-50 border-2 border-duo-blue text-duo-blue" 
                  : "hover:bg-gray-100 border-2 border-transparent text-[#777777]"
              )}
            >
              <Icon className={cn("w-7 h-7", isActive ? "text-duo-blue" : item.color)} />
              <span className="hidden lg:block text-sm tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 lg:px-4">
        <button className="flex items-center gap-4 px-3 py-3 rounded-2xl font-bold text-[#777777] hover:bg-gray-100 transition-all w-full text-left group">
          <Settings className="w-7 h-7 group-hover:rotate-45 transition-transform" />
          <span className="hidden lg:block text-sm">THIẾT LẬP</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
