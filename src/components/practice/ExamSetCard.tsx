import React from "react";
import { BookOpen, ChevronRight, Clock, Star } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface ExamSetCardProps {
  title: string;
  slug: string;
  examCount: number;
  isCompleted?: boolean;
}

const ExamSetCard: React.FC<ExamSetCardProps> = ({
  title,
  slug,
  examCount,
  isCompleted = false,
}) => {
  return (
    <Card className="flex flex-col gap-4 p-6 relative overflow-hidden group">
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <Star className="w-6 h-6 text-duo-yellow fill-duo-yellow" />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-duo-text group-hover:text-duo-blue transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {examCount} Đề thi
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              60 phút
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href={`/practice/${slug}`} className="flex-1">
          <Button variant="green" className="w-full gap-2">
            LUYỆN TẬP
            <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
        <Link href={`/exam/${slug}`}>
          <Button variant="outline" className="px-4">
            THI THỬ
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default ExamSetCard;
