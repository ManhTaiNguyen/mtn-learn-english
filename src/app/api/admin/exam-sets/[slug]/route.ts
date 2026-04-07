import { prisma } from "@/lib/prisma";
import { successResponse, notFoundError, conflictError, withErrorHandler } from "@/lib/api-response";
import { z } from "zod";

/**
 * GET /api/admin/exam-sets/[slug]
 * Lấy chi tiết bộ đề phục vụ soạn thảo (bao gồm toàn bộ Exams, Parts, Questions).
 */
export const GET = withErrorHandler(async (req, { params }) => {
  const { slug } = await params;

  const examSet = await prisma.examSet.findUnique({
    where: { slug, deleted_at: null },
    include: {
      exams: {
        include: {
          parts: {
            include: {
              questions: {
                orderBy: { order_index: "asc" }
              }
            },
            orderBy: { order_index: "asc" }
          }
        },
        orderBy: { created_at: "asc" }
      }
    }
  });

  if (!examSet) return notFoundError("Không tìm thấy bộ đề.");

  return successResponse(examSet);
});

/**
 * PUT /api/admin/exam-sets/[slug]
 * Cập nhật thông tin cơ bản của bộ đề.
 */
const updateSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  is_published: z.boolean().optional(),
});

export const PUT = withErrorHandler(async (req, { params }) => {
  const { slug: oldSlug } = await params;
  const body = await req.json();
  const data = updateSchema.parse(body);

  // Check unique slug if changed
  if (data.slug && data.slug !== oldSlug) {
    const existing = await prisma.examSet.findUnique({ where: { slug: data.slug } });
    if (existing) return conflictError("Slug mới đã tồn tại.");
  }

  const updated = await prisma.examSet.update({
    where: { slug: oldSlug },
    data: {
      ...data,
      updated_at: new Date()
    }
  });

  return successResponse(updated);
});

/**
 * DELETE /api/admin/exam-sets/[slug]
 * Xóa mềm bộ đề.
 */
export const DELETE = withErrorHandler(async (req, { params }) => {
  const { slug } = await params;

  await prisma.examSet.update({
    where: { slug },
    data: { deleted_at: new Date() }
  });

  return successResponse({ message: "Đã xóa bộ đề thành công." });
});
