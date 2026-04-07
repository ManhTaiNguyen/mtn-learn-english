"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { 
  Plus, 
  Flame, 
  Target, 
  Zap, 
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Settings
} from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="sticky top-0 right-0 h-16 w-full lg:w-[calc(100%-256px)] ml-auto border-b-2 border-duo-gray bg-white/95 backdrop-blur-md z-40 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex-1 flex items-center lg:hidden">
        <Link href="/">
          <h1 className="text-xl font-black text-duo-green tracking-tighter">
            KET Platform
          </h1>
        </Link>
      </div>

      <div className="hidden lg:flex flex-1 items-center gap-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài học..." 
            className="w-full bg-[#f7f7f7] border-2 border-transparent focus:border-duo-blue rounded-xl py-2 pl-10 pr-4 outline-none transition-all text-sm font-bold text-[#777777]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-2 group cursor-pointer">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="font-black text-orange-500 text-lg">15</span>
        </div>

        <div className="flex items-center gap-2 group cursor-pointer text-[#777777]">
          <Zap className="w-6 h-6 text-duo-yellow fill-duo-yellow" />
          <span className="font-black text-duo-yellow text-lg">500</span>
        </div>

        <div className="flex items-center gap-2 group cursor-pointer text-[#777777]">
          <Target className="w-6 h-6 text-duo-green" />
          <span className="font-black text-lg text-duo-green">85%</span>
        </div>

        <div className="h-8 w-px bg-duo-gray mx-2 hidden sm:block" />

        {status === "authenticated" ? (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full border-2 border-duo-gray overflow-hidden hover:border-duo-blue transition-all"
            >
              {session.user?.image ? (
                <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-duo-blue font-black text-sm">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
              )}
            </button>

            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-duo-gray rounded-2xl shadow-xl z-20 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b-2 border-duo-gray mb-2">
                    <p className="font-black text-duo-text text-sm truncate">{session.user?.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{session.user?.email}</p>
                  </div>
                  
                  <Link 
                    href="/ho-so" 
                    className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-[#777777] hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link 
                    href="/lich-su" 
                    className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-[#777777] hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Zap className="w-4 h-4" />
                    Lịch sử ôn luyện
                  </Link>
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-duo-red hover:bg-red-50 transition-colors border-t-2 border-duo-gray mt-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/dang-nhap">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              ĐĂNG NHẬP
            </Button>
          </Link>
        )}

        <Button variant="blue" size="sm" className="hidden lg:flex gap-2">
          <Plus className="w-5 h-5" />
          THI THỬ
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
