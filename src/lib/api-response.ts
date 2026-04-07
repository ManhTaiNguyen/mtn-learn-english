/**
 * API Response & Error Helpers
 *
 * Chuẩn hóa toàn bộ response format cho mọi Route Handler.
 * Xem tài liệu đầy đủ tại: docs/09-API-Response-Error-Matrix.md
 *
 * @example
 * ```ts
 * import { successResponse, errorResponse, withErrorHandler } from "@/lib/api-response";
 *
 * export const POST = withErrorHandler(async (req) => {
 *   const body = RegisterSchema.parse(await req.json());
 *   // ...business logic
 *   return createdResponse({ id: 1 }, "Đăng ký thành công.");
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma } from "@prisma/client";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Danh sách Error Codes — khớp với docs/09-API-Response-Error-Matrix.md §2
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_TOKEN"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "EXAM_EXPIRED"
  | "ACCOUNT_LOCKED"
  | "EXAM_PREREQUISITE"
  | "NOT_FOUND"
  | "ATTEMPT_NOT_FOUND"
  | "CONFLICT"
  | "ATTEMPT_EXISTS"
  | "ALREADY_SUBMITTED"
  | "UNPROCESSABLE"
  | "LOCKED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  status: "success";
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  status: "error";
  code: ErrorCode;
  message: string;
  errors?: FieldError[];
  retry_after?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Route Handler function signature */
type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

// ============================================================================
// Success Response Helpers
// ============================================================================

/**
 * Tạo success response (HTTP 200)
 *
 * @example
 * ```ts
 * return successResponse({ user: { id: 1, email: "a@b.com" } });
 * return successResponse(data, "Cập nhật thành công.");
 * ```
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = {
    status: "success",
    data,
  };

  if (message) body.message = message;

  return NextResponse.json(body, { status });
}

/**
 * Tạo success response (HTTP 201 Created)
 *
 * @example
 * ```ts
 * return createdResponse({ id: 42 }, "Đăng ký thành công.");
 * ```
 */
export function createdResponse<T>(
  data: T,
  message?: string,
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 201);
}

/**
 * Tạo success response kèm pagination metadata
 *
 * @example
 * ```ts
 * return paginatedResponse(examSets, { page: 1, limit: 20, total: 150, totalPages: 8 });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
): NextResponse<ApiSuccessResponse<T[]>> {
  const body: ApiSuccessResponse<T[]> = {
    status: "success",
    data,
    pagination,
  };

  if (message) body.message = message;

  return NextResponse.json(body, { status: 200 });
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Tạo error response chuẩn
 *
 * @example
 * ```ts
 * return errorResponse(404, "NOT_FOUND", "Không tìm thấy đề thi.");
 * return errorResponse(409, "CONFLICT", "Email đã tồn tại.", [
 *   { field: "email", message: "Email này đã được đăng ký." }
 * ]);
 * ```
 */
export function errorResponse(
  httpStatus: number,
  code: ErrorCode,
  message: string,
  errors?: FieldError[],
  retryAfter?: string,
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    status: "error",
    code,
    message,
  };

  if (errors?.length) body.errors = errors;
  if (retryAfter) body.retry_after = retryAfter;

  return NextResponse.json(body, { status: httpStatus });
}

// ============================================================================
// Convenience Error Shortcuts
// ============================================================================

/** 400 — Dữ liệu đầu vào không hợp lệ */
export function validationError(
  errors: FieldError[],
  message: string = "Dữ liệu không hợp lệ.",
): NextResponse<ApiErrorResponse> {
  return errorResponse(400, "VALIDATION_ERROR", message, errors);
}

/** 401 — Chưa đăng nhập */
export function unauthorizedError(
  message: string = "Vui lòng đăng nhập để tiếp tục.",
): NextResponse<ApiErrorResponse> {
  return errorResponse(401, "UNAUTHORIZED", message);
}

/** 403 — Không có quyền */
export function forbiddenError(
  message: string = "Bạn không có quyền thực hiện hành động này.",
): NextResponse<ApiErrorResponse> {
  return errorResponse(403, "FORBIDDEN", message);
}

/** 404 — Không tìm thấy */
export function notFoundError(
  message: string = "Không tìm thấy dữ liệu yêu cầu.",
): NextResponse<ApiErrorResponse> {
  return errorResponse(404, "NOT_FOUND", message);
}

/** 409 — Dữ liệu trùng lặp */
export function conflictError(
  message: string = "Dữ liệu đã tồn tại trong hệ thống.",
): NextResponse<ApiErrorResponse> {
  return errorResponse(409, "CONFLICT", message);
}

/** 500 — Lỗi server */
export function internalError(
  message: string = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
): NextResponse<ApiErrorResponse> {
  return errorResponse(500, "INTERNAL_ERROR", message);
}

// ============================================================================
// Zod Error Transformer
// ============================================================================

/**
 * Chuyển đổi ZodError thành mảng FieldError chuẩn
 *
 * Zod v4 issue base: { path: PropertyKey[], message: string }
 * → Transform thành: { field: "email", message: "Invalid email" }
 */
function zodErrorToFieldErrors(error: z.core.$ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "_root",
    message: issue.message,
  }));
}

// ============================================================================
// Prisma Error Mapper
// ============================================================================

/**
 * Map Prisma known errors → chuẩn API error response
 *
 * | Prisma Code | HTTP | Error Code       |
 * |-------------|------|------------------|
 * | P2002       | 409  | CONFLICT         |
 * | P2025       | 404  | NOT_FOUND        |
 * | P2003       | 400  | VALIDATION_ERROR |
 * | P2023       | 400  | VALIDATION_ERROR |
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): NextResponse<ApiErrorResponse> {
  switch (error.code) {
    case "P2002": {
      // Unique constraint violation — extract field name from meta
      const target = (error.meta?.target as string[])?.join(", ") ?? "unknown";
      return errorResponse(409, "CONFLICT", `Dữ liệu đã tồn tại (${target}).`);
    }
    case "P2025":
      return errorResponse(404, "NOT_FOUND", "Không tìm thấy dữ liệu yêu cầu.");
    case "P2003":
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Dữ liệu tham chiếu không hợp lệ.",
      );
    case "P2023":
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Dữ liệu không đúng định dạng.",
      );
    default:
      return errorResponse(
        500,
        "INTERNAL_ERROR",
        "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
      );
  }
}

// ============================================================================
// Global Error Handler (HOF)
// ============================================================================

/**
 * Higher-Order Function bọc Route Handler — tự động catch & transform errors.
 *
 * **Bắt buộc** wrap mọi Route Handler bằng hàm này.
 *
 * Xử lý tự động:
 * - `ZodError` → 400 VALIDATION_ERROR + field-level errors
 * - `PrismaClientKnownRequestError` → mapped HTTP status
 * - `ApiError` (custom) → mapped HTTP status + error code
 * - Unhandled → 500 INTERNAL_ERROR (KHÔNG leak stack trace)
 *
 * @example
 * ```ts
 * // app/api/auth/register/route.ts
 * import { withErrorHandler, createdResponse } from "@/lib/api-response";
 *
 * export const POST = withErrorHandler(async (req) => {
 *   const body = RegisterSchema.parse(await req.json());
 *   const user = await createUser(body);
 *   return createdResponse({ id: user.id }, "Đăng ký thành công.");
 * });
 * ```
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error: unknown) {
      // 1. Zod validation error
      if (error instanceof z.ZodError) {
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "Dữ liệu không hợp lệ.",
          zodErrorToFieldErrors(error),
        );
      }

      // 2. Custom API error (thrown from service layer)
      if (error instanceof ApiError) {
        return errorResponse(
          error.httpStatus,
          error.code,
          error.message,
          error.errors,
          error.retryAfter,
        );
      }

      // 3. Prisma known request error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error);
      }

      // 4. Prisma connection / initialization error
      if (
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError
      ) {
        console.error("[API] Database connection error:", error);
        return errorResponse(
          503,
          "SERVICE_UNAVAILABLE",
          "Hệ thống đang bảo trì. Vui lòng thử lại sau ít phút.",
        );
      }

      // 5. Unhandled error — log full details, return safe message
      console.error("[API] Unhandled error:", error);
      return errorResponse(
        500,
        "INTERNAL_ERROR",
        "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
      );
    }
  };
}

// ============================================================================
// Custom ApiError Class
// ============================================================================

/**
 * Custom error class cho service layer — throw để withErrorHandler auto-catch.
 *
 * @example
 * ```ts
 * // Trong service layer
 * throw new ApiError(403, "EXAM_PREREQUISITE",
 *   "Bạn phải hoàn thành kỹ năng Nghe trước khi làm Đọc - Viết."
 * );
 *
 * throw new ApiError(423, "LOCKED",
 *   "Tài khoản tạm thời bị khóa.",
 *   undefined,
 *   lockedUntil.toISOString()
 * );
 * ```
 */
export class ApiError extends Error {
  public readonly httpStatus: number;
  public readonly code: ErrorCode;
  public readonly errors?: FieldError[];
  public readonly retryAfter?: string;

  constructor(
    httpStatus: number,
    code: ErrorCode,
    message: string,
    errors?: FieldError[],
    retryAfter?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.code = code;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }
}

// ============================================================================
// Type Guard (cho Frontend)
// ============================================================================

/**
 * Type guard kiểm tra response có phải error hay không
 *
 * @example
 * ```ts
 * const res = await fetch("/api/auth/register");
 * const json = await res.json();
 * if (isApiError(json)) {
 *   console.log(json.code, json.message);
 * }
 * ```
 */
export function isApiError(
  response: ApiResponse<unknown>,
): response is ApiErrorResponse {
  return response.status === "error";
}

/**
 * Type guard kiểm tra response thành công
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.status === "success";
}
