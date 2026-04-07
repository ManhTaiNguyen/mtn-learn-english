"use client";

import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar placeholder */}
      <nav className="border-b-2 border-duo-gray">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-duo-green text-white shadow-[0_4px_0_#46a302]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-duo-green">
              KET Platform
            </span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/login" className="font-bold uppercase tracking-wide text-gray-400 hover:text-gray-600">
              Đăng nhập
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-12 md:flex-row md:py-24">
        {/* Hero Illustration Placeholder */}
        <div className="mb-12 flex flex-1 items-center justify-center md:mb-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="relative flex h-64 w-64 items-center justify-center rounded-full bg-duo-blue/10 md:h-80 md:w-80"
          >
            <div className="absolute inset-0 animate-pulse rounded-full border-4 border-dashed border-duo-blue/20" />
            <GraduationCap className="h-32 w-32 text-duo-blue md:h-40 md:w-40" />
          </motion.div>
        </div>

        {/* Hero Content */}
        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-4xl font-bold leading-tight text-duo-text md:text-5xl"
          >
            Cách học tiếng Anh <br />
            <span className="text-duo-green">vui nhộn và hiệu quả!</span>
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10 max-w-md text-xl text-gray-500"
          >
            Chinh phục chứng chỉ Cambridge KET với các bài ôn tập ngắn gọn, 
            trực quan và hoàn toàn miễn phí.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex w-full flex-col gap-4 sm:flex-row"
          >
            <Link href="/practice" className="duo-button duo-button-green w-full text-lg uppercase tracking-wider sm:w-auto">
              Bắt đầu ngay
            </Link>
            <Link href="/exam" className="duo-button duo-button-blue w-full text-lg uppercase tracking-wider sm:w-auto">
              Thi thử KET
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-yellow-500" />}
              title="Ôn tập nhanh"
              description="Luyện nghe và đọc chỉ trong 5-10 phút mỗi ngày."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 text-duo-green" />}
              title="Phòng thi chuẩn"
              description="Trải nghiệm áp lực thực tế với bộ đếm ngược 30 phút."
            />
            <FeatureCard 
              icon={<Trophy className="h-8 w-8 text-orange-400" />}
              title="Lịch sử điểm số"
              description="Theo dõi tiến độ và xem lại lỗi sai chi tiết."
            />
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-duo-gray py-12">
        <div className="mx-auto max-w-5xl px-6 text-center text-gray-400">
          <p className="font-bold tracking-wide uppercase mb-2">KET Platform</p>
          <p>© 2026 ManhTaiNguyen. Made with ❤️ for English Learners.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center rounded-2xl border-2 border-duo-gray bg-white p-8 text-center shadow-[0_4px_0_#e5e5e5]"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-duo-text">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </motion.div>
  );
}
