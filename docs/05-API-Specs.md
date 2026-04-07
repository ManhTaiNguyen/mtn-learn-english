# Core API Specifications (RESTful)

Tài liệu này định nghĩa cấu trúc Request/Response cho các API lõi của Hệ thống. Routing được đặt trong folder `/app/api/` theo chuẩn Next.js 15 Route Handlers.

---

## Quy ước chung

### Error Response Format (Chuẩn hóa lỗi)

Mọi API khi trả lỗi đều tuân theo format sau:

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Mô tả lỗi user-friendly bằng tiếng Việt",
  "errors": [{ "field": "email", "message": "Định dạng email không hợp lệ." }]
}
```

**Danh sách Error Codes:**
| HTTP Status | Code | Mô tả |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền truy cập resource |
| 403 | `EXAM_EXPIRED` | Bài thi đã hết thời gian |
| 403 | `ACCOUNT_LOCKED` | Tài khoản bị khóa tạm thời |
| 404 | `NOT_FOUND` | Resource không tồn tại |
| 409 | `CONFLICT` | Dữ liệu trùng lặp (email đã tồn tại) |
| 423 | `LOCKED` | Tài khoản bị khóa do login sai quá nhiều |
| 429 | `RATE_LIMITED` | Vượt quá giới hạn request |

### Pagination Format (Phân trang)

Các API trả danh sách đều hỗ trợ phân trang:

- **Query params:** `?page=1&limit=20`
- **Response metadata:**

```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 1. Authentication (Xác thực)

### 1.1 Đăng ký tài khoản

- `POST /api/auth/register`
- **Mô tả:** Tạo tài khoản mới bằng Email/Password.
- **Rate Limit:** 3 req/giờ/IP
- **Payload:**

```json
{
  "email": "learner@example.com",
  "password": "SecurePass123",
  "full_name": "Nguyễn Văn A"
}
```

- **Response (201 Created):**

```json
{
  "status": "success",
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
  "data": {
    "id": 42,
    "email": "learner@example.com"
  }
}
```

- **Error Cases:**
  - `409 CONFLICT` — Email đã tồn tại.
  - `400 VALIDATION_ERROR` — Password không đủ mạnh.

### 1.2 Đăng nhập (NextAuth Credentials)

- `POST /api/auth/callback/credentials`
- **Mô tả:** Xác thực Email/Password, trả JWT session cookie.
- **Rate Limit:** 5 req/5 phút/IP
- **Xử lý Backend:**
  1. `SELECT * FROM accounts WHERE email = ?`
  2. Check `is_active = TRUE` (tài khoản chưa bị khóa vĩnh viễn).
  3. Check `locked_until` — nếu `NOW() < locked_until` → trả `423 LOCKED`.
  4. `bcrypt.compare(password, password_hash)`.
  5. Nếu sai → `failed_login_count += 1`. Nếu `>= 5` → set `locked_until = NOW() + 15min`.
  6. Nếu đúng → reset `failed_login_count = 0`, `locked_until = NULL`, update `last_login_at`.
  7. Sinh JWT cookie (`HttpOnly`, `SameSite=Lax`, `Secure`).
- **Response (200 OK):** NextAuth tự set cookie, redirect.
- **Error Cases:**
  - `401 UNAUTHORIZED` — Sai email hoặc password.
  - `423 LOCKED` — Tài khoản bị khóa tạm thời (kèm `retry_after` timestamp).
  - `403 FORBIDDEN` — Tài khoản bị vô hiệu hóa (`is_active = false`).

### 1.3 Quên mật khẩu (Forgot Password)

- `POST /api/auth/forgot-password`
- **Mô tả:** Gửi email chứa link reset password.
- **Rate Limit:** 3 req/giờ/email
- **Payload:**

```json
{
  "email": "learner@example.com"
}
```

- **Xử lý Backend:**
  1. Tìm account theo email. Nếu không tồn tại → vẫn trả 200 (tránh leak thông tin email có tồn tại hay không).
  2. Sinh random token (32 bytes hex), hash bằng SHA-256 rồi lưu vào `password_reset_token`.
  3. Set `password_reset_expires = NOW() + 1 giờ`.
  4. Gửi email chứa link: `https://domain.com/reset-password?token={raw_token}&email={email}`.
- **Response (200 OK):**

```json
{
  "status": "success",
  "message": "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
}
```

### 1.4 Đặt lại mật khẩu (Reset Password)

- `POST /api/auth/reset-password`
- **Payload:**

```json
{
  "email": "learner@example.com",
  "token": "raw_token_from_email_link",
  "new_password": "NewSecure456"
}
```

- **Xử lý Backend:**
  1. Hash token bằng SHA-256, so khớp với `password_reset_token` trong DB.
  2. Check `password_reset_expires > NOW()`.
  3. Hash `new_password` bằng bcrypt, update `password_hash`.
  4. Clear `password_reset_token`, `password_reset_expires`, `failed_login_count`, `locked_until`.
- **Response (200 OK):**

```json
{
  "status": "success",
  "message": "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập."
}
```

- **Error Cases:**
  - `400 VALIDATION_ERROR` — Token không hợp lệ hoặc đã hết hạn.

### 1.5 Đăng xuất

- `POST /api/auth/logout`
- **Mô tả:** Xóa session cookie.
- **Auth:** Yêu cầu JWT cookie hợp lệ.
- **Response (200 OK):**

```json
{
  "status": "success",
  "message": "Đã đăng xuất."
}
```

---

## 2. Ôn Luyện (Practice) & Sessions

### 2.1 Khởi tạo Phiên Ẩn danh

- `POST /api/sessions/init`
- **Mô tả:** Cấp Anonymous UUID cho client (dành cho chức năng ôn tập Public).
- **Rate Limit:** 10 req/giờ/IP
- **Headers:** Client IP (via Vercel header), Fingerprint
- **Payload:**

```json
{
  "fingerprint": "base64_device_hash"
}
```

- **Xử lý Backend:**
  1. Validate fingerprint (required, string, max 255 chars).
  2. Check rate limit theo IP.
  3. Sinh UUID v4, INSERT vào `anonymous_sessions`.
  4. Set `anonymous_id` vào response body VÀ `HttpOnly` cookie (để server tự đọc ở các API sau — không tin client gửi lên).
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "anonymous_id": "b1b22e4d-5c8e-4f51-b062-817c182216fd",
    "expires_at": "2026-04-14T09:00:00Z"
  }
}
```

---

## 3. Hệ Thống Câu Hỏi & Đề Thi

### 3.1 Get chi tiết Exam Set (Ví dụ: KET 1)

- `GET /api/exam-sets/:slug/details`
- **Mô tả:** Lấy thông tin cơ bản về Bộ đề (không bao gồm đáp án, phục vụ UI landing page).
- **Auth:** Public (không cần auth).
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "KET Practice Test 1",
    "slug": "ket-practice-test-1",
    "exams": [
      {
        "id": 10,
        "skill_type": "listening",
        "duration_sec": 1800
      },
      {
        "id": 11,
        "skill_type": "reading_writing",
        "duration_sec": 4200
      }
    ]
  }
}
```

### 3.2 Danh sách Exam Sets (Trang chủ)

- `GET /api/exam-sets?page=1&limit=20`
- **Mô tả:** Lấy danh sách bộ đề đã publish cho trang chủ.
- **Auth:** Public.
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "KET Practice Test 1",
      "slug": "ket-practice-test-1",
      "is_published": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

## 4. Engine Làm Bài (Test Engine)

### 4.1 Bắt đầu làm bài thi (Tạo Attempt)

- `POST /api/attempts/start`
- **Mô tả:** Sinh attempt ID để bắt đầu track lịch sử làm bài.
- **Auth:**
  - Mode `EXAM`: Yêu cầu JWT cookie (account đã login).
  - Mode `PRACTICE`: Yêu cầu `anonymous_id` cookie (server tự đọc từ HttpOnly cookie, **KHÔNG** từ request body).
- **Payload:**

```json
{
  "exam_id": 10,
  "mode": "EXAM"
}
```

> ⚠️ **Lưu ý bảo mật:** `anonymous_id` KHÔNG được gửi trong payload. Server tự đọc từ HttpOnly cookie đã set lúc `/sessions/init`. Điều này ngăn attacker giả mạo session của người khác.

- **Xử lý Backend (Business Validation):**
  1. Nếu `mode = EXAM` → check JWT, lấy `account_id` từ session.
  2. Nếu `mode = PRACTICE` → đọc `anonymous_id` từ cookie.
  3. **Kiểm tra khóa đề:** Nếu exam là `reading_writing`, check DB xem Listening cùng exam_set đã `status = 'submitted'` chưa. Nếu chưa → `403 FORBIDDEN`.
  4. Tính `expires_at = NOW() + exam.duration_sec`.
- **Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "attempt_id": 1500,
    "status": "in_progress",
    "started_at": "2026-04-07T03:00:00Z",
    "expires_at": "2026-04-07T03:30:00Z"
  }
}
```

### 4.2 Lấy chi tiết câu hỏi (Load Đề)

- `GET /api/attempts/:attempt_id/questions`
- **Mô tả:** Dựa trên attempt, trả về payload câu hỏi để UI render.
- **Auth:** Owner check — chỉ account/anonymous sở hữu attempt mới được truy cập.
- **⚠️ Anti-Cheat:** Backend PHẢI loại bỏ `correct_answer` và `explanation` khỏi response khi `mode = EXAM`. Dùng DTO mapping (lodash `.omit()`) tại layer API.
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "parts": [
      {
        "order_index": 1,
        "title": "Part 1 - 5 questions",
        "instruction": "Listen and choose the correct answer.",
        "audio_url": "https://cdn.example.com/audio/ket1-part1.mp3",
        "questions": [
          {
            "id": 501,
            "order_index": 1,
            "type": "mcq",
            "score_weight": 1,
            "data": {
              "question": "What time does the train leave?",
              "options": ["A. 8:00", "B. 9:00", "C. 10:00"]
            }
          }
        ]
      }
    ]
  }
}
```

### 4.3 Auto-save Đáp án (Batch)

- `POST /api/attempts/:attempt_id/answers/batch`
- **Mô tả:** API gọi ngầm định kì mỗi 30s hoặc khi đổi Part.
- **Auth:** Owner check.
- **Xử lý Backend:**
  1. Check `expires_at + 120s grace period`. Nếu quá hạn → `403 EXAM_EXPIRED`.
  2. `INSERT ... ON DUPLICATE KEY UPDATE` (Batch upsert).
- **Payload:**

```json
{
  "answers": [
    { "question_id": 501, "answer_json": "A" },
    { "question_id": 502, "answer_json": "B" }
  ]
}
```

- **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "saved_count": 2,
    "last_saved_at": "2026-04-07T03:15:30Z"
  }
}
```

### 4.4 Nộp bài (Submit)

- `POST /api/attempts/:attempt_id/submit`
- **Auth:** Owner check.
- **Xử lý Backend (Server Side):**
  1. Khóa attempt `status = 'submitted'`, set `submitted_at = NOW()`.
  2. Gọi Scoring Engine: loop DB so khớp `answer_json` vs `data_json.correct_answer`, tính điểm theo `score_weight`.
  3. Ghi `total_score` và `score_json` (breakdown từng part).
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "message": "Nộp bài thành công",
    "total_score": 15,
    "max_score": 25,
    "submitted_at": "2026-04-07T03:28:00Z",
    "score_breakdown": {
      "Part 1": { "score": 5, "max": 5 },
      "Part 2": { "score": 10, "max": 20 }
    }
  }
}
```

### 4.5 Xem kết quả chi tiết (Review)

- `GET /api/attempts/:attempt_id/result`
- **Auth:** Owner check. Chỉ trả khi `status = 'submitted'`.
- **Mô tả:** Trả về kết quả chi tiết kèm đáp án đúng và giải thích (chỉ sau khi đã nộp bài).
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "attempt_id": 1500,
    "total_score": 15,
    "max_score": 25,
    "submitted_at": "2026-04-07T03:28:00Z",
    "answers": [
      {
        "question_id": 501,
        "user_answer": "A",
        "correct_answer": "B",
        "is_correct": false,
        "score_achieved": 0,
        "explanation": "The train leaves at 9:00 as mentioned in the announcement."
      }
    ]
  }
}
```

---

## 5. Lịch sử thi (History)

### 5.1 Danh sách lượt thi của User

- `GET /api/attempts/history?page=1&limit=10`
- **Auth:** JWT required.
- **Mô tả:** Lấy danh sách các lượt thi đã hoàn thành của user đang login.
- **Response (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "attempt_id": 1500,
      "exam_title": "KET Practice Test 1 - Listening",
      "skill_type": "listening",
      "status": "submitted",
      "total_score": 15,
      "max_score": 25,
      "started_at": "2026-04-07T03:00:00Z",
      "submitted_at": "2026-04-07T03:28:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## 6. Admin APIs (CMS - Quản trị nội dung)

Tất cả Admin APIs yêu cầu JWT với `role = 'admin'`. Trả `403 FORBIDDEN` nếu không đủ quyền.

### 6.1 CRUD Exam Sets

| Method   | Endpoint                               | Mô tả                                       |
| -------- | -------------------------------------- | ------------------------------------------- |
| `GET`    | `/api/admin/exam-sets?page=1&limit=20` | Danh sách (bao gồm cả draft & soft-deleted) |
| `POST`   | `/api/admin/exam-sets`                 | Tạo mới                                     |
| `PUT`    | `/api/admin/exam-sets/:id`             | Cập nhật (title, slug, is_published)        |
| `DELETE` | `/api/admin/exam-sets/:id`             | Soft delete (set `deleted_at`)              |

### 6.2 CRUD Exams (trong Exam Set)

| Method   | Endpoint                            | Mô tả                               |
| -------- | ----------------------------------- | ----------------------------------- |
| `GET`    | `/api/admin/exam-sets/:setId/exams` | Danh sách exams trong set           |
| `POST`   | `/api/admin/exam-sets/:setId/exams` | Tạo exam mới                        |
| `PUT`    | `/api/admin/exams/:id`              | Cập nhật (skill_type, duration_sec) |
| `DELETE` | `/api/admin/exams/:id`              | Soft delete                         |

### 6.3 CRUD Parts & Questions

| Method   | Endpoint                             | Mô tả                                      |
| -------- | ------------------------------------ | ------------------------------------------ |
| `GET`    | `/api/admin/exams/:examId/parts`     | Danh sách parts + questions                |
| `POST`   | `/api/admin/exams/:examId/parts`     | Tạo part mới                               |
| `PUT`    | `/api/admin/parts/:id`               | Cập nhật part                              |
| `DELETE` | `/api/admin/parts/:id`               | Soft delete                                |
| `POST`   | `/api/admin/parts/:partId/questions` | Tạo question mới                           |
| `PUT`    | `/api/admin/questions/:id`           | Cập nhật question (data_json, explanation) |
| `DELETE` | `/api/admin/questions/:id`           | Soft delete                                |

> **Cache Invalidation:** Mọi thao tác CUD (Create/Update/Delete) phải trigger `redis.del('EXAM_DATA:{exam_id}')` và `revalidatePath()` để refresh ISR cache.

### 6.4 Quản lý Users (Admin)

| Method | Endpoint                           | Mô tả                           |
| ------ | ---------------------------------- | ------------------------------- |
| `GET`  | `/api/admin/users?page=1&limit=20` | Danh sách users                 |
| `PUT`  | `/api/admin/users/:id/status`      | Khóa/Mở tài khoản (`is_active`) |
| `PUT`  | `/api/admin/users/:id/role`        | Đổi role                        |
