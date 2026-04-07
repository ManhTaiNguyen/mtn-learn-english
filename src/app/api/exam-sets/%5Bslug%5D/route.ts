import { prisma } from "@/lib/prisma";
import { successResponse, notFoundError, withErrorHandler } from "@/lib/api-response";

/**
 * GET /api/exam-sets/[slug]
 * 
 * Lấy chi tiết một bộ đề và danh sách các bài thi (Reading, Listening,...) bên trong.
 */
export const GET = withErrorHandler(async (req, { params }) => {
  const { slug } = await params;

  const examSet = await prisma.examSet.findUnique({
    where: { 
      slug,
      deleted_at: null 
    },
    include: {
      exams: {
        where: { deleted_at: null },
        include: {
          parts: {
            where: { deleted_at: null },
            include: {
              questions: {
                where: { deleted_at: null },
                orderBy: { order_index: "asc" }
              }
            },
            orderBy: { order_index: "asc" }
          }
        }
      }
    }
  });

  if (!examSet) {
    return notFoundError("Không tìm thấy bộ đề thi yêu cầu.");
  }

  return successResponse(examSet);
});
