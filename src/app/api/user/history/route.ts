import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  successResponse, 
  unauthorizedError, 
  withErrorHandler 
} from "@/lib/api-response";

/**
 * GET /api/user/history
 * 
 * Lấy lịch sử làm bài của User.
 */
export const GET = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedError();

  const attempts = await prisma.attempt.findMany({
    where: {
      account_id: parseInt(session.user.id),
      status: "submitted",
    },
    include: {
      exam: {
        include: {
          exam_set: true,
        },
      },
    },
    orderBy: {
      submitted_at: "desc",
    },
    take: 50,
  });

  const formattedHistory = attempts.map((attempt) => ({
    id: attempt.id,
    exam_title: attempt.exam.exam_set.title,
    skill_type: attempt.exam.skill_type,
    score: attempt.total_score,
    submitted_at: attempt.submitted_at,
    mode: attempt.mode,
  }));

  return successResponse(formattedHistory);
});
