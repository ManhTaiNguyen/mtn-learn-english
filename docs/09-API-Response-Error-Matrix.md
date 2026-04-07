# API Response & Error Matrix

Tài liệu chuẩn hóa **toàn bộ** response format (success + error) cho mọi API endpoint trong hệ thống. Mọi Route Handler đều **BẮT BUỘC** tuân thủ format này — sử dụng helper functions trong [`src/lib/api-response.ts`](../src/lib/api-response.ts).

> **Liên kết tài liệu:**
>
> - Error format gốc: [`05-API-Specs.md` → Quy ước chung](./05-API-Specs.md)
> - Validation rules: [`07-Data-Validation-Matrix.md`](./07-Data-Validation-Matrix.md)
> - Error tracking: [`08-Senior-Dev-Notes.md` → Logging](./08-Senior-Dev-Notes.md)

---

## 1. Response Envelope (Chuẩn hóa cấu trúc)

### 1.1 Success Response

```json
{
  "status": "success",
  "message": "Mô tả hành động thành công (tùy chọn)",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

| Field        | Type             | Required | Mô tả                                             |
| ------------ | ---------------- | -------- | ------------------------------------------------- |
| `status`     | `"success"`      | ✅       | Luôn là `"success"`                               |
| `message`    | `string`         | ❌       | Tin nhắn mô tả (dùng cho toast notification ở FE) |
| `data`       | `T \| T[]`       | ✅       | Payload chính — object hoặc array                 |
| `pagination` | `PaginationMeta` | ❌       | Chỉ có khi API trả danh sách có phân trang        |

### 1.2 Error Response

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Mô tả lỗi user-friendly bằng tiếng Việt",
  "errors": [{ "field": "email", "message": "Định dạng email không hợp lệ." }],
  "retry_after": "2026-04-07T03:15:00Z"
}
```

| Field         | Type           | Required | Mô tả                                                           |
| ------------- | -------------- | -------- | --------------------------------------------------------------- |
| `status`      | `"error"`      | ✅       | Luôn là `"error"`                                               |
| `code`        | `ErrorCode`    | ✅       | Mã lỗi machine-readable (xem bảng Error Code Registry)          |
| `message`     | `string`       | ✅       | Thông báo lỗi tiếng Việt, user-friendly                         |
| `errors`      | `FieldError[]` | ❌       | Chi tiết lỗi từng field — chỉ có khi `code = VALIDATION_ERROR`  |
| `retry_after` | `string (ISO)` | ❌       | Thời điểm hết khóa — chỉ có khi `code = LOCKED \| RATE_LIMITED` |

### 1.3 TypeScript Types

> Xem implementation đầy đủ tại [`src/lib/api-response.ts`](../src/lib/api-response.ts)

```typescript
type ErrorCode =
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

interface ApiSuccessResponse<T> {
  status: "success";
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

interface ApiErrorResponse {
  status: "error";
  code: ErrorCode;
  message: string;
  errors?: FieldError[];
  retry_after?: string;
}
```

---

## 2. Error Code Registry (Danh mục mã lỗi đầy đủ)

| HTTP Status | Error Code            | Mô tả                                   | Khi nào xảy ra                                    | Message mẫu (tiếng Việt)                                        |
| ----------- | --------------------- | --------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| 400         | `VALIDATION_ERROR`    | Dữ liệu đầu vào không hợp lệ            | Zod parse fail, field thiếu/sai format            | "Dữ liệu không hợp lệ."                                         |
| 400         | `INVALID_TOKEN`       | Token reset password sai hoặc hết hạn   | Token SHA-256 không khớp DB / expired             | "Token không hợp lệ hoặc đã hết hạn."                           |
| 401         | `UNAUTHORIZED`        | Chưa đăng nhập hoặc session hết hạn     | Missing/expired JWT cookie                        | "Vui lòng đăng nhập để tiếp tục."                               |
| 403         | `FORBIDDEN`           | Không có quyền truy cập resource        | Role không đủ (vd: user truy cập Admin API)       | "Bạn không có quyền thực hiện hành động này."                   |
| 403         | `EXAM_EXPIRED`        | Bài thi đã hết thời gian                | `NOW() > expires_at + 120s` (grace period)        | "Bài thi đã hết thời gian làm bài."                             |
| 403         | `ACCOUNT_LOCKED`      | Tài khoản bị vô hiệu hóa vĩnh viễn      | `is_active = false`                               | "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ." |
| 403         | `EXAM_PREREQUISITE`   | Chưa hoàn thành skill yêu cầu trước     | Listening chưa submitted trước khi làm R&W        | "Bạn phải hoàn thành kỹ năng Nghe trước khi làm Đọc - Viết."    |
| 404         | `NOT_FOUND`           | Resource không tồn tại                  | ID/slug không tìm thấy trong DB                   | "Không tìm thấy dữ liệu yêu cầu."                               |
| 404         | `ATTEMPT_NOT_FOUND`   | Attempt không tồn tại                   | `attempt_id` sai hoặc đã bị xóa                   | "Không tìm thấy phiên làm bài."                                 |
| 409         | `CONFLICT`            | Dữ liệu trùng lặp                       | Email/slug unique constraint violation            | "Dữ liệu đã tồn tại trong hệ thống."                            |
| 409         | `ATTEMPT_EXISTS`      | Đã có attempt đang in_progress          | User tạo attempt trùng cho cùng exam              | "Bạn đang có phiên làm bài chưa hoàn thành cho đề này."         |
| 410         | `ALREADY_SUBMITTED`   | Bài đã nộp rồi, không thể thao tác thêm | Submit/save vào attempt đã `status = 'submitted'` | "Bài thi đã được nộp, không thể thay đổi."                      |
| 422         | `UNPROCESSABLE`       | Dữ liệu đúng format nhưng vi phạm logic | Business rule fail (vd: xem result khi chưa nộp)  | "Không thể xử lý yêu cầu do vi phạm quy tắc nghiệp vụ."         |
| 423         | `LOCKED`              | Tài khoản bị khóa tạm thời              | Login sai ≥ 5 lần → `locked_until` active         | "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau."             |
| 429         | `RATE_LIMITED`        | Vượt quá giới hạn request               | Rate limit exceeded (IP/email)                    | "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."           |
| 500         | `INTERNAL_ERROR`      | Lỗi server không xác định               | Unhandled exception, DB query fail                | "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."                 |
| 503         | `SERVICE_UNAVAILABLE` | Service phụ thuộc không khả dụng        | DB/Redis connection pool exhausted                | "Hệ thống đang bảo trì. Vui lòng thử lại sau ít phút."          |

---

## 3. Error Matrix theo API Endpoint

### 3.1 Authentication APIs

| #   | Endpoint                         | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                                                                                                                                     |
| --- | -------------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/auth/register`             | POST   | `201`   | `400 VALIDATION_ERROR` (email/password/full_name invalid) · `409 CONFLICT` (email đã tồn tại) · `429 RATE_LIMITED` (>3 req/giờ/IP) · `500 INTERNAL_ERROR`                                                                                            |
| 2   | `/api/auth/callback/credentials` | POST   | `200`   | `400 VALIDATION_ERROR` (thiếu email/password) · `401 UNAUTHORIZED` (sai email hoặc password) · `403 ACCOUNT_LOCKED` (is_active=false) · `423 LOCKED` (locked_until + kèm `retry_after`) · `429 RATE_LIMITED` (>5 req/5min/IP) · `500 INTERNAL_ERROR` |
| 3   | `/api/auth/forgot-password`      | POST   | `200`   | `400 VALIDATION_ERROR` (email invalid) · `429 RATE_LIMITED` (>3 req/giờ/email) · `500 INTERNAL_ERROR`                                                                                                                                                |
| 4   | `/api/auth/reset-password`       | POST   | `200`   | `400 VALIDATION_ERROR` (new_password invalid) · `400 INVALID_TOKEN` (token sai/hết hạn) · `500 INTERNAL_ERROR`                                                                                                                                       |
| 5   | `/api/auth/logout`               | POST   | `200`   | `401 UNAUTHORIZED` (chưa đăng nhập) · `500 INTERNAL_ERROR`                                                                                                                                                                                           |

**Chi tiết Error Response mẫu:**

```json
// POST /api/auth/register → 409 CONFLICT
{
  "status": "error",
  "code": "CONFLICT",
  "message": "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập."
}

// POST /api/auth/callback/credentials → 423 LOCKED
{
  "status": "error",
  "code": "LOCKED",
  "message": "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.",
  "retry_after": "2026-04-07T03:30:00Z"
}

// POST /api/auth/register → 400 VALIDATION_ERROR
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu đăng ký không hợp lệ.",
  "errors": [
    { "field": "email", "message": "Định dạng email không hợp lệ." },
    { "field": "password", "message": "Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ cái, 1 số và 1 ký tự đặc biệt." }
  ]
}
```

---

### 3.2 Session APIs

| #   | Endpoint             | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                      |
| --- | -------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/sessions/init` | POST   | `200`   | `400 VALIDATION_ERROR` (fingerprint invalid) · `429 RATE_LIMITED` (>10 req/giờ/IP) · `500 INTERNAL_ERROR` · `503 SERVICE_UNAVAILABLE` |

---

### 3.3 Exam Set APIs (Public)

| #   | Endpoint                       | Method | Success | Tất cả Error Cases có thể xảy ra                                   |
| --- | ------------------------------ | ------ | ------- | ------------------------------------------------------------------ |
| 1   | `/api/exam-sets`               | GET    | `200`   | `400 VALIDATION_ERROR` (page/limit invalid) · `500 INTERNAL_ERROR` |
| 2   | `/api/exam-sets/:slug/details` | GET    | `200`   | `404 NOT_FOUND` (slug không tồn tại) · `500 INTERNAL_ERROR`        |

---

### 3.4 Test Engine APIs

| #   | Endpoint                                  | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------- | ------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/attempts/start`                     | POST   | `201`   | `400 VALIDATION_ERROR` (exam_id/mode invalid) · `401 UNAUTHORIZED` (EXAM mode, chưa login) · `403 EXAM_PREREQUISITE` (Listening chưa xong) · `404 NOT_FOUND` (exam_id không tồn tại) · `409 ATTEMPT_EXISTS` (đã có attempt in_progress) · `429 RATE_LIMITED` · `500 INTERNAL_ERROR` |
| 2   | `/api/attempts/:attempt_id/questions`     | GET    | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` (không phải owner) · `404 ATTEMPT_NOT_FOUND` · `500 INTERNAL_ERROR`                                                                                                                                                                            |
| 3   | `/api/attempts/:attempt_id/answers/batch` | POST   | `200`   | `400 VALIDATION_ERROR` (answers array invalid) · `401 UNAUTHORIZED` · `403 FORBIDDEN` (không phải owner) · `403 EXAM_EXPIRED` (hết thời gian + 120s grace) · `404 ATTEMPT_NOT_FOUND` · `410 ALREADY_SUBMITTED` · `500 INTERNAL_ERROR`                                               |
| 4   | `/api/attempts/:attempt_id/submit`        | POST   | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` (không phải owner) · `404 ATTEMPT_NOT_FOUND` · `410 ALREADY_SUBMITTED` · `500 INTERNAL_ERROR`                                                                                                                                                  |
| 5   | `/api/attempts/:attempt_id/result`        | GET    | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` (không phải owner) · `404 ATTEMPT_NOT_FOUND` · `422 UNPROCESSABLE` (attempt chưa submitted) · `500 INTERNAL_ERROR`                                                                                                                             |

**Chi tiết Error Response mẫu:**

```json
// POST /api/attempts/start → 403 EXAM_PREREQUISITE
{
  "status": "error",
  "code": "EXAM_PREREQUISITE",
  "message": "Bạn phải hoàn thành kỹ năng Nghe trước khi làm Đọc - Viết."
}

// POST /api/attempts/:id/answers/batch → 403 EXAM_EXPIRED
{
  "status": "error",
  "code": "EXAM_EXPIRED",
  "message": "Bài thi đã hết thời gian làm bài. Đáp án không được lưu."
}

// POST /api/attempts/:id/submit → 410 ALREADY_SUBMITTED
{
  "status": "error",
  "code": "ALREADY_SUBMITTED",
  "message": "Bài thi đã được nộp trước đó, không thể nộp lại."
}

// GET /api/attempts/:id/result → 422 UNPROCESSABLE
{
  "status": "error",
  "code": "UNPROCESSABLE",
  "message": "Chưa thể xem kết quả vì bài thi chưa được nộp."
}
```

---

### 3.5 History APIs

| #   | Endpoint                | Method | Success | Tất cả Error Cases có thể xảy ra                                                        |
| --- | ----------------------- | ------ | ------- | --------------------------------------------------------------------------------------- |
| 1   | `/api/attempts/history` | GET    | `200`   | `400 VALIDATION_ERROR` (page/limit invalid) · `401 UNAUTHORIZED` · `500 INTERNAL_ERROR` |

---

### 3.6 Admin — Exam Set Management

| #   | Endpoint                   | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                        |
| --- | -------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/admin/exam-sets`     | GET    | `200`   | `400 VALIDATION_ERROR` (page/limit) · `401 UNAUTHORIZED` · `403 FORBIDDEN` (not admin) · `500 INTERNAL_ERROR`                           |
| 2   | `/api/admin/exam-sets`     | POST   | `201`   | `400 VALIDATION_ERROR` (title/slug invalid) · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `409 CONFLICT` (slug trùng) · `500 INTERNAL_ERROR` |
| 3   | `/api/admin/exam-sets/:id` | PUT    | `200`   | `400 VALIDATION_ERROR` · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `409 CONFLICT` (slug trùng) · `500 INTERNAL_ERROR`    |
| 4   | `/api/admin/exam-sets/:id` | DELETE | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`                                                           |

### 3.7 Admin — Exam Management

| #   | Endpoint                            | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                         |
| --- | ----------------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/admin/exam-sets/:setId/exams` | GET    | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` (setId) · `500 INTERNAL_ERROR`                                                    |
| 2   | `/api/admin/exam-sets/:setId/exams` | POST   | `201`   | `400 VALIDATION_ERROR` (skill_type/duration_sec) · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` (setId) · `500 INTERNAL_ERROR` |
| 3   | `/api/admin/exams/:id`              | PUT    | `200`   | `400 VALIDATION_ERROR` · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`                                   |
| 4   | `/api/admin/exams/:id`              | DELETE | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`                                                            |

### 3.8 Admin — Parts & Questions Management

| #   | Endpoint                             | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                              |
| --- | ------------------------------------ | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/admin/exams/:examId/parts`     | GET    | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` (examId) · `500 INTERNAL_ERROR`                                                        |
| 2   | `/api/admin/exams/:examId/parts`     | POST   | `201`   | `400 VALIDATION_ERROR` (order_index/instruction) · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` (examId) · `500 INTERNAL_ERROR`     |
| 3   | `/api/admin/parts/:id`               | PUT    | `200`   | `400 VALIDATION_ERROR` · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`                                        |
| 4   | `/api/admin/parts/:id`               | DELETE | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`                                                                 |
| 5   | `/api/admin/parts/:partId/questions` | POST   | `201`   | `400 VALIDATION_ERROR` (type/data_json/score_weight) · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` (partId) · `500 INTERNAL_ERROR` |
| 6   | `/api/admin/questions/:id`           | PUT    | `200`   | `400 VALIDATION_ERROR` (data_json schema mismatch) · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`            |
| 7   | `/api/admin/questions/:id`           | DELETE | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `500 INTERNAL_ERROR`                                                                 |

### 3.9 Admin — User Management

| #   | Endpoint                      | Method | Success | Tất cả Error Cases có thể xảy ra                                                                                                   |
| --- | ----------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/api/admin/users`            | GET    | `200`   | `400 VALIDATION_ERROR` (page/limit) · `401 UNAUTHORIZED` · `403 FORBIDDEN` · `500 INTERNAL_ERROR`                                  |
| 2   | `/api/admin/users/:id/status` | PUT    | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `422 UNPROCESSABLE` (admin tự khóa chính mình) · `500 INTERNAL_ERROR`     |
| 3   | `/api/admin/users/:id/role`   | PUT    | `200`   | `401 UNAUTHORIZED` · `403 FORBIDDEN` · `404 NOT_FOUND` · `422 UNPROCESSABLE` (admin tự đổi role chính mình) · `500 INTERNAL_ERROR` |

---

## 4. Error Handling Flow

```
Client Request
    │
    ▼
┌─────────────────────────────────────────┐
│  withErrorHandler() — Global Wrapper    │
│  Bọc toàn bộ Route Handler              │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  1. Zod Validation (Parse request body) │
│  ─────────────────────────────────────  │
│  Fail → 400 VALIDATION_ERROR            │
│         + field-level errors[]          │
└────────────────┬────────────────────────┘
                 │ Pass
                 ▼
┌─────────────────────────────────────────┐
│  2. Auth Check (JWT / Anonymous cookie) │
│  ─────────────────────────────────────  │
│  No token    → 401 UNAUTHORIZED         │
│  Wrong role  → 403 FORBIDDEN            │
│  Locked      → 423 LOCKED               │
│  Deactivated → 403 ACCOUNT_LOCKED       │
└────────────────┬────────────────────────┘
                 │ Pass
                 ▼
┌─────────────────────────────────────────┐
│  3. Business Logic (Service Layer)      │
│  ─────────────────────────────────────  │
│  Not found     → 404 NOT_FOUND          │
│  Conflict      → 409 CONFLICT           │
│  Expired       → 403 EXAM_EXPIRED       │
│  Prerequisite  → 403 EXAM_PREREQUISITE  │
│  Already done  → 410 ALREADY_SUBMITTED  │
│  Logic fail    → 422 UNPROCESSABLE      │
└────────────────┬────────────────────────┘
                 │ Pass
                 ▼
┌─────────────────────────────────────────┐
│  4. Success Response                    │
│  ─────────────────────────────────────  │
│  200 OK / 201 Created                   │
│  + data payload                         │
└─────────────────────────────────────────┘

         ┌────────────────────┐
         │  Unhandled Error   │
         │  (catch block)     │
         │  ────────────────  │
         │  PrismaError P2002 │
         │    → 409 CONFLICT  │
         │  PrismaError P2025 │
         │    → 404 NOT_FOUND │
         │  Khác              │
         │    → 500 INTERNAL  │
         └────────────────────┘
```

---

## 5. Implementation Pattern

### 5.1 Helper Functions

Xem implementation đầy đủ tại [`src/lib/api-response.ts`](../src/lib/api-response.ts).

**Cách sử dụng trong Route Handler:**

```typescript
import {
  successResponse,
  createdResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/api-response";
import { z } from "zod/v4";

const RegisterSchema = z.object({
  email: z.string().email().min(5).max(150),
  password: z.string().min(8).max(72),
  full_name: z.string().min(2).max(255).trim(),
});

export const POST = withErrorHandler(async (req) => {
  const body = await req.json();
  const data = RegisterSchema.parse(body); // Throw → auto catch → 400

  // Business logic...
  const existing = await prisma.account.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return errorResponse(
      409,
      "CONFLICT",
      "Email này đã được đăng ký. Vui lòng sử dụng email khác."
    );
  }

  const account = await prisma.account.create({ data: { ... } });
  return createdResponse(
    { id: account.id, email: account.email },
    "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
  );
});
```

### 5.2 Prisma Error Mapping

| Prisma Error Code | HTTP Status | Error Code         | Mô tả                            |
| ----------------- | ----------- | ------------------ | -------------------------------- |
| `P2002`           | 409         | `CONFLICT`         | Unique constraint violation      |
| `P2025`           | 404         | `NOT_FOUND`        | Record not found (update/delete) |
| `P2003`           | 400         | `VALIDATION_ERROR` | Foreign key constraint failed    |
| `P2023`           | 400         | `VALIDATION_ERROR` | Inconsistent column data         |
| Khác              | 500         | `INTERNAL_ERROR`   | Lỗi database không xác định      |

### 5.3 Zod Error Transform

Khi Zod validation fail, `withErrorHandler` tự động transform `ZodError` thành response format chuẩn:

```json
// Zod throw → auto transform
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ.",
  "errors": [
    { "field": "email", "message": "Invalid email" },
    {
      "field": "password",
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
```

---

## 6. Frontend Error Contract

### 6.1 Error Type Definitions (Client-side)

```typescript
// types/api.ts — FE import để type-safe
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Hàm check response
function isApiError(res: ApiResponse<unknown>): res is ApiErrorResponse {
  return res.status === "error";
}
```

### 6.2 Error → UI Action Mapping

| Error Code            | UI Action                                                 | Toast Type |
| --------------------- | --------------------------------------------------------- | ---------- |
| `VALIDATION_ERROR`    | Highlight field lỗi + show inline error message           | ❌ Error   |
| `UNAUTHORIZED`        | Redirect → `/login` + clear local state                   | ⚠️ Warning |
| `FORBIDDEN`           | Show "Không có quyền" + disable action button             | ❌ Error   |
| `EXAM_EXPIRED`        | Auto-submit bài + show modal "Hết thời gian"              | ⚠️ Warning |
| `ACCOUNT_LOCKED`      | Show modal liên hệ hỗ trợ                                 | ❌ Error   |
| `EXAM_PREREQUISITE`   | Redirect về trang Listening + show hướng dẫn              | ℹ️ Info    |
| `NOT_FOUND`           | Show 404 page hoặc "Không tìm thấy"                       | ❌ Error   |
| `ATTEMPT_NOT_FOUND`   | Redirect về trang chọn đề                                 | ❌ Error   |
| `CONFLICT`            | Show "Đã tồn tại" + suggest action (login/đổi email)      | ⚠️ Warning |
| `ATTEMPT_EXISTS`      | Show "Bạn có bài đang làm dở" + button "Tiếp tục làm bài" | ℹ️ Info    |
| `ALREADY_SUBMITTED`   | Show "Bài đã nộp" + button "Xem kết quả"                  | ℹ️ Info    |
| `UNPROCESSABLE`       | Show thông báo lý do cụ thể từ `message`                  | ⚠️ Warning |
| `LOCKED`              | Show countdown timer dựa trên `retry_after`               | ⚠️ Warning |
| `RATE_LIMITED`        | Show "Thử lại sau" + disable button tạm thời              | ⚠️ Warning |
| `INTERNAL_ERROR`      | Show "Lỗi hệ thống" + button "Thử lại"                    | ❌ Error   |
| `SERVICE_UNAVAILABLE` | Show maintenance banner + auto-retry sau 30s              | ⚠️ Warning |

---

## 7. Quy tắc bắt buộc khi implement API

1. **KHÔNG BAO GIỜ** trả raw error message từ database/library ra client. Luôn dùng message tiếng Việt user-friendly.
2. **MỌI** Route Handler phải được wrap bằng `withErrorHandler()` — đảm bảo không có unhandled exception nào leak stack trace.
3. **KHÔNG** trả `password_hash`, `password_reset_token`, hay bất kỳ sensitive field nào trong response (kể cả error response).
4. Error response **LUÔN** phải có `code` field — FE dựa vào `code` (không phải `message`) để xử lý logic.
5. `message` chỉ dùng để hiển thị cho user — **KHÔNG** dùng `message` để branching logic ở FE.
6. Log **ĐẦY ĐỦ** error details phía server (stack trace, request body) nhưng **CHỈ** trả message tóm tắt cho client.
7. Khi thêm API mới, **BẮT BUỘC** cập nhật Error Matrix trong tài liệu này.
