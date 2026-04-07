import { prisma } from "@/lib/prisma";
import { 
  successResponse, 
  createdResponse, 
  errorResponse, 
  withErrorHandler 
} from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";

const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(5).max(150),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(72),
  full_name: z.string().min(2, "Họ tên tối thiểu 2 ký tự").max(255).trim(),
});

/**
 * POST /api/auth/register
 * 
 * Đăng ký tài khoản mới.
 */
export const POST = withErrorHandler(async (req) => {
  const body = await req.json();
  const data = RegisterSchema.parse(body);

  // 1. Kiểm tra email tồn tại
  const existingUser = await prisma.account.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return errorResponse(
      409,
      "CONFLICT",
      "Email này đã được đăng ký. Vui lòng sử dụng email khác."
    );
  }

  // 2. Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(data.password, salt);

  // 3. Tạo tài khoản và thông tin đi kèm (Transaction)
  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        role: "user",
        is_active: true,
      },
    });

    await tx.accountInfo.create({
      data: {
        account_id: account.id,
        full_name: data.full_name,
      },
    });

    return account;
  });

  return createdResponse(
    { id: result.id, email: result.email },
    "Đăng ký tài khoản thành công! Bây giờ bạn có thể đăng nhập."
  );
});
