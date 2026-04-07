import { prisma } from "@/lib/prisma";
import { successResponse, withErrorHandler } from "@/lib/api-response";

/**
 * GET /api/leaderboard
 * 
 * Lấy danh sách Top học viên dựa trên tổng điểm kinh nghiệm (XP).
 * XP được tính bằng tổng total_score của tất cả các Attempt đã submit.
 */
export const GET = withErrorHandler(async (req) => {
  // Thực hiện query tổng hợp điểm số theo account_id
  const topUsers = await prisma.attempt.groupBy({
    by: ['account_id'],
    where: {
      status: 'submitted',
      account_id: { not: null }
    },
    _sum: {
      total_score: true
    },
    orderBy: {
      _sum: {
        total_score: 'desc'
      }
    },
    take: 20
  });

  // Lấy thông tin chi tiết của các account này
  const accountIds = topUsers.map(u => u.account_id as number);
  const accounts = await prisma.account.findMany({
    where: {
      id: { in: accountIds }
    },
    include: {
      info: true
    }
  });

  // Map lại dữ liệu cuối cùng
  const leaderboard = topUsers.map((item, index) => {
    const account = accounts.find(a => a.id === item.account_id);
    return {
      rank: index + 1,
      id: account?.id,
      name: account?.info?.full_name || "Học viên ẩn danh",
      avatar: account?.info?.avatar_url,
      xp: item._sum.total_score || 0,
      role: account?.role
    };
  });

  return successResponse(leaderboard);
});
