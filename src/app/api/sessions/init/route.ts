import { ensureAnonymousSession } from "@/lib/session";
import { successResponse, withErrorHandler } from "@/lib/api-response";

/**
 * POST /api/sessions/init
 * 
 * Khởi tạo hoặc lấy thông tin phiên ẩn danh.
 * Đảm bảo anonymous_id được lưu trong DB và Cookie.
 */
export const POST = withErrorHandler(async (req) => {
  // ensureAnonymousSession sẽ check cookie và upsert vào DB
  const anonymousId = await ensureAnonymousSession();
  
  return successResponse(
    { anonymous_id: anonymousId },
    "Khởi tạo phiên làm việc thành công."
  );
});
