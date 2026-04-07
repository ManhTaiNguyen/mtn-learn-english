import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  successResponse, 
  unauthorizedError, 
  errorResponse, 
  withErrorHandler 
} from "@/lib/api-response";
import { z } from "zod/v4";

const UpdateProfileSchema = z.object({
  full_name: z.string().min(2).max(255).optional(),
  phone_number: z.string().max(20).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

/**
 * GET /api/user/profile
 */
export const GET = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedError();

  const info = await prisma.accountInfo.findUnique({
    where: { account_id: parseInt(session.user.id) },
  });

  return successResponse({
    id: session.user.id,
    email: session.user.email,
    full_name: info?.full_name || "",
    phone_number: info?.phone_number || "",
    avatar_url: info?.avatar_url || "",
  });
});

/**
 * PUT /api/user/profile
 */
export const PUT = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedError();

  const body = await req.json();
  const data = UpdateProfileSchema.parse(body);

  const updatedInfo = await prisma.accountInfo.upsert({
    where: { account_id: parseInt(session.user.id) },
    update: {
      full_name: data.full_name,
      phone_number: data.phone_number,
      avatar_url: data.avatar_url,
    },
    create: {
      account_id: parseInt(session.user.id),
      full_name: data.full_name || "User",
      phone_number: data.phone_number,
      avatar_url: data.avatar_url,
    },
  });

  return successResponse(updatedInfo, "Cập nhật hồ sơ thành công!");
});
