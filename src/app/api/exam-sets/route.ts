import { prisma } from "@/lib/prisma";
import { successResponse, withErrorHandler } from "@/lib/api-response";

/**
 * GET /api/exam-sets
 * 
 * Lấy danh sách các bộ đề đã xuất bản.
 */
export const GET = withErrorHandler(async (req) => {
  const examSets = await prisma.examSet.findMany({
    where: {
      is_published: true,
      deleted_at: null,
    },
    include: {
      exams: {
        select: {
          skill_type: true
        }
      },
      _count: {
        select: { exams: true },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Transform to match frontend needs if necessary
  const formattedExamSets = examSets.map((set) => ({
    id: set.id,
    title: set.title,
    slug: set.slug,
    examCount: set._count.exams,
    skills: set.exams.map(e => e.skill_type),
    isCompleted: false, 
  }));

  return successResponse(formattedExamSets);
});
