import { prisma } from "@/lib/prisma";
import { successResponse, withErrorHandler } from "@/lib/api-response";

/**
 * GET /api/admin/stats
 * 
 * Lấy số liệu thống kê cho Dashboard Quản trị.
 */
export const GET = withErrorHandler(async (req) => {
  const [userCount, examSetCount, attemptCount] = await Promise.all([
    prisma.account.count({ where: { role: 'user' } }),
    prisma.examSet.count({ where: { deleted_at: null } }),
    prisma.attempt.count({ where: { status: 'submitted' } }),
  ]);

  // Lấy lịch sử nộp bài gần đây (Top 10)
  const recentAttempts = await prisma.attempt.findMany({
    where: { status: 'submitted' },
    include: {
      exam: { include: { exam_set: true } },
      account: { include: { info: true } },
      anonymous: true,
    },
    orderBy: { submitted_at: 'desc' },
    take: 10
  });

  const formattedAttempts = recentAttempts.map(a => ({
    id: a.id,
    user: a.account?.info?.full_name || "Khách ẩn danh",
    exam: `${a.exam.exam_set.title} (${a.exam.skill_type})`,
    score: a.total_score,
    at: a.submitted_at
  }));

  return successResponse({
    stats: {
      users: userCount,
      exams: examSetCount,
      submissions: attemptCount
    },
    recent_activity: formattedAttempts
  });
});
