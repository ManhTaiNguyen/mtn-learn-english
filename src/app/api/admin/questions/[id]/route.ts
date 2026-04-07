import { prisma } from "@/lib/prisma";
import { successResponse, withErrorHandler } from "@/lib/api-response";
import { z } from "zod";

/**
 * PUT /api/admin/questions/[id]
 * Cập nhật thuộc tính của câu hỏi (bao gồm data_json).
 */
const updateSchema = z.object({
  type: z.string().optional(),
  data_json: z.any().optional(),
  order_index: z.number().int().optional(),
});

export const PUT = withErrorHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const data = updateSchema.parse(body);

  const updated = await prisma.question.update({
    where: { id: parseInt(id) },
    data: {
      ...data,
      updated_at: new Date()
    }
  });

  return successResponse(updated);
});
