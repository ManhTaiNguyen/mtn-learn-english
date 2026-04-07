# Cache, System Security & Bruteforce Protection

Tài liệu này định nghĩa kiến trúc tối ưu hiệu năng (Caching), các rào chắn bảo vệ hệ thống (Security) và chiến lược xử lý các rủi ro hệ thống bị tấn công cho KET Platform.

---

## 1. Caching Strategy (Chiến lược Caching)

Vì nền tảng theo định hướng Public-first, content (danh sách đề, phần thi, đề thi) hầu như không đổi theo thời gian thực. Ta tận dụng triệt để Cache để giảm tải Database (MySQL).

### 1.1 ISR (Incremental Static Regeneration) của Next.js

- **Đối tượng:**
  - Trang chủ (Danh sách Exam Sets).
  - Trang `[slug]` thông tin đề thi.
- **Cơ chế:** Next.js build sẵn HTML. Chỉnh `revalidate: 60` (1 phút) hoặc `300` (5 phút) để Data tự refresh trong background mà không gọi DB khi user đang hit page.
- **Lợi ích:**
  - TTFB (Time To First Byte) cực nhanh (<50ms).
  - SEO đỉnh cao vì trang load nhanh, content tĩnh.

### 1.2. Redis Caching (Application Layer)

- **Đối tượng:**
  - Cấu trúc đề thi chi tiết + toàn bộ Content Câu hỏi `data_json` (Khi user Click "Bắt đầu làm bài").
- **Cơ chế:**
  - `EXAM_DATA:{exam_id}`. TTL: 1 tiếng.
  - Khi User Bắt đầu làm bài, API gọi tới DB tải toàn bộ Part + Questions nếu RAM Redis chưa có (Cache Miss), set Cache (Cache Hit cho User thứ 2, 3...).
- **Lợi ích:** Tránh sập MySQL khi 1 lớp học 50 học sinh cùng lúc click nút "Bắt đầu làm bài".

### 1.3. Cache Invalidation (Khi Admin cập nhật nội dung)

- Khi Admin CRUD exam/question qua CMS → gọi `redis.del('EXAM_DATA:{exam_id}')` để xóa cache cũ.
- Kết hợp Next.js `revalidatePath()` hoặc `revalidateTag()` để refresh ISR pages.

---

## 2. Hệ Thống Bảo Vệ (Bruteforce & Limiters)

Hệ thống cho phép Anonymous (ẩn danh) là một rủi ro lớn vì botnet có thể làm phình to DB bằng cách gọi API khởi tạo session liên tục.

### 2.1. Rate Limiting trên Redis

Sử dụng thư viện Middleware/Redis Rate limit chặn các hành vi abuse:

| Endpoint                         | Limit/IP                     | Hành động chống DDOS / Spam                                        |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `POST /api/sessions/init`        | Tối đa **10 req / Giờ**      | Kẻ xấu spam tạo session ẩn danh. Session chỉ cần tạo 1 lần/device. |
| `POST /api/attempts`             | Tối đa 5 req / Minute        | Spam bắt đầu làm đề liên tục.                                      |
| `POST /api/auth/callback`        | Tối đa 5 req / 5 Minute / IP | Bruteforce password Admin / User login.                            |
| `POST /api/auth/register`        | Tối đa 3 req / Giờ / IP      | Spam tạo tài khoản rác.                                            |
| `POST /api/auth/forgot-password` | Tối đa 3 req / Giờ / Email   | Spam gửi email reset password.                                     |

### 2.2. Account Lockout (Khóa tài khoản tạm thời)

Rate limit theo IP không đủ — attacker dùng nhiều IP (proxy/VPN) vẫn brute-force được password. Cần thêm cơ chế khóa theo tài khoản:

**Cơ chế:**

1. Mỗi lần login sai → `failed_login_count += 1` trong bảng `accounts`.
2. Khi `failed_login_count >= 5` → set `locked_until = NOW() + 15 phút`.
3. Mọi request login tiếp theo check: `if (NOW() < locked_until) → Return 423 Locked`.
4. Login thành công → reset `failed_login_count = 0`, `locked_until = NULL`.

**Thông báo cho User:**

- Lần sai thứ 3: "Bạn còn 2 lần thử trước khi tài khoản bị khóa tạm thời."
- Khi bị khóa: "Tài khoản đã bị khóa tạm thời. Vui lòng thử lại sau 15 phút hoặc sử dụng chức năng Quên mật khẩu."

### 2.3. XSS & CSRF Protection

- **CSRF:** Khác với NestJS, mô hình Next.js App Router (Server Actions & Route Handlers dùng JSON) mặc định khá an toàn với CSRF qua Auth rules. NextAuth v5 tích hợp sẵn chống CSRF bằng token.
- **XSS Prevention trong Dynamic Content:**
  - Đề thi dạng Fill-in-the-blank / MCQ do Admin nhập bằng editor JSON.
  - Phía Client UI (React): Tuyệt đối KHÔNG dùng `dangerouslySetInnerHTML` với user input; Nếu phải display HTML từ Admin (Instruction text), sanitize bằng thư viện `DOMPurify` trước khi render.

### 2.4. Hạn chế "Cheat" Thời Gian Làm Bài (Time Hacking)

- **Vấn đề:** Local JS Timer dễ dàng bị User lợi dụng bằng cách sửa giờ trong máy tính hoặc tắt Internet.
- **Giải pháp Server-Side TTL:**
  1. Lúc `POST /api/attempts/start`: BE tính toán `expires_at` = T_now() + T_duration (Ví dụ: 9:00 + 30 phút = 9:30).
  2. Mọi API `POST /answers` (auto-save) đều bị intercept qua Middleware check thời gian.
  3. `if (ServerNow() > expires_at + 2mins_grace_period) -> Return 403 Expired`. Ngừng chấm tiếp tục bài này. Toàn bộ record Auto-save phút cuối được giữ nguyên, force State sang `submitted`.

### 2.5. Garbage Collection (Clear Sessions Rác)

- Bảng `anonymous_sessions` trên MySQL có thể dính "DB Bloating" nếu 90% visitors thoát trang sau 2 click mà không làm bài thi.
- **Giải pháp:**
  - Tạo Cronjob/Worker chạy vào lúc 3A.M hàng ngày.
  - Trigger SQL:
    ```sql
    DELETE FROM anonymous_sessions
    WHERE expires_at < NOW()
      AND id NOT IN (
        SELECT DISTINCT anonymous_id
        FROM attempts
        WHERE anonymous_id IS NOT NULL
      );
    ```
    _(Xóa toàn bộ session đã hết hạn VÀ không có bất kỳ bài thi nào liên kết — kể cả bài đang làm dở hoặc đã nộp. Tránh xóa nhầm session đang có attempt `in_progress`)._

---

## 3. Kiến trúc bảo mật cho JWT / Session Storage

Với chức năng Ôn luyện (Public), ta lưu trữ state phòng thi dựa trên UUID.

**Storage Strategy:**

- `anonymous_id`: Lưu tại `localStorage`. Dễ tiếp cận. Mất (Clear Cache Chrome) = Mất lịch sử. Chấp nhận trade-off này cho luồng Public Practice.
- **⚠️ Quan trọng:** Backend KHÔNG tin tưởng `anonymous_id` từ client request body. Thay vào đó:
  - Khi tạo session, server set `anonymous_id` vào cả response body (để FE lưu localStorage) VÀ một `HttpOnly` cookie riêng.
  - Khi FE gọi API tạo attempt mode PRACTICE, server đọc `anonymous_id` từ cookie — KHÔNG từ request payload.
  - Điều này ngăn attacker giả mạo `anonymous_id` của người khác.
- **Account Admin/User:**
  - NextAuth config: Sinh JWT.
  - Vị trí: Lưu vào `HttpOnly`, `SameSite=Lax`, `Secure` cookies. Chống triệt để việc hacker lấy cắp Token qua XSS payload.

---

## 4. HTTP Security Headers

Cấu hình trong `next.config.js` hoặc Middleware để đảm bảo mọi response đều có headers bảo mật:

| Header                      | Giá trị                                                                                                                                                       | Mục đích                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `X-Frame-Options`           | `DENY`                                                                                                                                                        | Chống Clickjacking — không cho phép embed trang trong iframe |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                     | Ngăn browser đoán MIME type sai                              |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`                                                                                                                         | Bắt buộc HTTPS (HSTS)                                        |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                                                                             | Kiểm soát thông tin referrer gửi đi                          |
| `Content-Security-Policy`   | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.*; media-src 'self' https://cdn.*` | Chống XSS injection từ external scripts                      |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                                                                                                                    | Tắt các API nhạy cảm không cần thiết                         |

**Cấu hình mẫu `next.config.js`:**

```javascript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

module.exports = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

## 5. CORS Configuration

Cấu hình CORS cho API routes để chỉ chấp nhận request từ domain chính thức:

```javascript
// middleware.ts hoặc route handler
const allowedOrigins = [
  "https://ket-platform.vercel.app", // Production
  "http://localhost:3000", // Development
];
```

- API routes chỉ chấp nhận requests từ `allowedOrigins`.
- Không bao giờ set `Access-Control-Allow-Origin: *` cho authenticated endpoints.
- Preflight requests (`OPTIONS`) phải được handle đúng cách.
