import { prisma } from "@/lib/prisma";
import { successResponse, createdResponse, conflictError, withErrorHandler } from "@/lib/api-response";
import { z } from "zod";

/**
 * GET /api/admin/exam-sets
 * Lấy toàn bộ danh sách bộ đề (kể cả chưa xuất bản).
 */
export const GET = withErrorHandler(async (req) => {
  const examSets = await prisma.examSet.findMany({
    where: { deleted_at: null },
    include: {
      _count: { select: { exams: true } }
    },
    orderBy: { created_at: "desc" }
  });

  return successResponse(examSets);
});

/**
 * POST /api/admin/exam-sets
 * Tạo bộ đề mới.
 */
const createSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
});

export const POST = withErrorHandler(async (req) => {
  const body = await req.json();
  const data = createSchema.parse(body);

  // Check unique slug
  const existing = await prisma.examSet.findUnique({ where: { slug: data.slug } });
  if (existing) return conflictError("Slug đã tồn tại.");

  const newSet = await prisma.examSet.create({
    data: {
      title: data.title,
      slug: data.slug,
      is_published: false
    }
  });

  return createdResponse(newSet);
});
