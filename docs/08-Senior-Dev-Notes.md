# Ghi chú & Lời khuyên Kiến trúc (Senior Dev / Architect Notes)

Tài liệu này lưu lại những phân tích, rủi ro đánh đổi (trade-offs) và tư duy kiến trúc nâng cao từ góc nhìn của Senior Software Architect. Đọc kỹ trước khi deploy/refactor code.

---

## 1. Phân Tích Hiện Tượng "Hydration Mismatch" Đồng Hồ Timer

**Vấn đề phổ biến nhất ở Next.js 15:**
SSR (Server Side Rendering) tính toán HTML thời gian đếm ngược (Ví dụ: `29:59`) từ Server. Gửi xuống Client, Client JS bundle load và chạy hàm `setInterval`. Lúc này chênh lệch mili-giây dẫn tới React báo lỗi vàng chói mắt _Hydration Text Mismatch_.

**Giải Pháp Kinh Nghiệm:**

- Component `<Timer />` nên render `null` ở lần mount đầu phía Server (sử dụng useEffect set `isMounted = true`).
- Hoặc hiển thị Skeleton Component lúc SSR, lên ngậm Client xong mới bắt đầu nạp Context báo số thời gian thực. Bỏ qua vài chục mili-giây đầu tiên.

---

## 2. Hệ Thống Auto-Save Chống Crash Database (N+1 Writes)

- Đừng bao giờ tạo API lưu 1 câu 1 dòng. Giả sử 50 user thi thử, mỗi người đổi đáp án liên tục ở 50 câu. Backend nhận 2500 requests/giây để lưu MySQL. MySQL pool connections cạn kiệt rất nhanh.
- **Quy Tắc Kiến Trúc Vàng:**
  Dùng cơ chế **Flush Pattern**. Frontend Zustand lưu local một `draftState`. Khi `draftState` thay đổi, trigger `debounce(30_000, api.sync)`. Nghĩa là gom hết mọi thay đổi trong 30 giây vào 1 JSON body, gửi cái rụp 1 lượt cho Backend dùng `Prisma.createMany() / upsert()`.

---

## 3. Dynamic JSON cho đề thi: Vũ khí linh hoạt nhưng...

MySQL 8.0 `JSON` support tuyệt vời, nhưng đi kèm điểm yếu chết người: Mất tính Type-Safe giữa cấu trúc DB và cấu trúc TypeScript (nếu không map cẩn thận).

**Làm sao để Scale JSON này?**

- Xây dựng `zod` Schema cực mạnh ngay cạnh Type Prisma lấy về.
- Ví dụ: Bất cứ lúc nào map record từ DB lên thành API Response, Server phải passthrough dữ liệu qua một hàm Parse:

```typescript
const payload = dbQuestion.data_json;
const questionData = z
  .union([McqSchema, FillBlankSchema, MatchingSchema])
  .parse(payload);
```

Sẽ hơi tốn CPU một chút, nhưng cam kết hệ thống không bao giờ sụp do 1 thằng FE lấy nhầm Data không tồn tại.

---

## 4. Chống Gian Lận (Anti-Cheat) Ở Layer API

Hệ thống chấm thi (Scoring) KET platform hoạt động trên server-side.

- Nếu bạn fetch API lấy đề (`/questions`) và gửi kèm đáp án chuẩn (correct_answer) xuống máy Client (React) rồi giấu ở đâu đó trong HTML/JS Variable -> Bọn trẻ con bây giờ có thể bật Dev Tools, search JSON Payload và pass bài 100 điểm trong 2 giây.

**Nguyên tắc Bất Di Bất Dịch:**

1. Khi query data xuống Frontend cho API `Get-Exam`, dùng lodash `.omit()` hoặc Prisma `select` loại bỏ triệt để key `"correct_answer"` và `"explanation"` (Bóp nghẹt tại Layer DTO). Chỉ trả lại khi `attempt.status = 'submitted'`.
2. Khi User Submit API `/submit`. Backend tự chọc vào CSDL gốc, tự so khớp 2 string JSON rồi ghi thẳng vô cột Score. Frontend chả cần biết nó đúng sai gì cho tới khi Submit thành công đổi trạng thái màn hình.

---

## 5. Chiến lược Deploy (Vercel & MySQL)

Bạn có thể gặp cảnh "Timeout MySQL connection pool" khi ném Next.js lên Vercel. Tại sao? Vì Vercel chạy Serverless Instances. Tức là 1 nghìn người vào web có thể sinh ra 1 nghìn Connection đâm thẳng vào CSDL — MySQL giới hạn tối đa có 100 Connection!

**Kiến trúc Database Connection:**

- Đừng trỏ chuỗi Database URL thẳng vào MySQL gốc.
- Phải sử dụng **Connection Pooling Mechanism**:
  - **Prisma Accelerate** (Khuyến nghị): Prisma cung cấp sẵn connection pooling ở Edge, xử lý cực tốt vấn đề serverless. Chỉ cần đổi `DATABASE_URL` sang Accelerate URL.
  - **ProxySQL**: Nếu self-host MySQL, dùng ProxySQL làm middleware proxy connection pooling (tương đương PgBouncer bên PostgreSQL).
  - **PlanetScale / Railway Proxy**: Các managed MySQL providers thường có built-in connection pooling.
- Cấu hình Prisma cho serverless:

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

> **⚠️ Lưu ý:** Tài liệu cũ đề cập PgBouncer — đó là công cụ của PostgreSQL, KHÔNG dùng cho MySQL. Hệ thống này dùng MySQL nên phải dùng ProxySQL hoặc Prisma Accelerate.

---

## 6. Bảo mật Password — Những điều KHÔNG được làm

**Checklist bắt buộc:**

1. **KHÔNG BAO GIỜ** lưu password dạng plaintext hoặc MD5/SHA-1 (quá yếu).
2. **LUÔN** dùng bcrypt với cost factor ≥ 12 (hoặc Argon2id nếu muốn tốt hơn).
3. **KHÔNG** log password ra console/file log dù ở môi trường dev.
4. **KHÔNG** trả password_hash trong bất kỳ API response nào (kể cả Admin API).
5. Bcrypt chỉ xử lý tối đa 72 bytes — validate `password.max(72)` ở Zod để tránh silent truncation.
6. Password reset token phải hash (SHA-256) trước khi lưu DB — không lưu raw token.

---

## 7. Logging & Monitoring Strategy

Hệ thống production cần có observability tối thiểu:

### 7.1 Structured Logging

```typescript
// Dùng pino hoặc winston với JSON format
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Ví dụ log có context
logger.info(
  { userId: 42, attemptId: 1500, action: "submit_exam" },
  "User submitted exam",
);
logger.error(
  { err, endpoint: "/api/attempts/start" },
  "Failed to create attempt",
);
```

### 7.2 Error Tracking

- Tích hợp **Sentry** (hoặc tương đương) để catch unhandled errors ở cả Server và Client.
- Cấu hình Sentry trong `next.config.js` với `@sentry/nextjs`.
- Set up alerts cho: error rate spike, 5xx responses, database connection failures.

### 7.3 Key Metrics cần monitor

| Metric                   | Mục đích                    | Alert threshold  |
| ------------------------ | --------------------------- | ---------------- |
| API Response Time (p95)  | Phát hiện bottleneck        | > 2s             |
| Error Rate (5xx)         | Phát hiện sự cố             | > 1%             |
| DB Connection Pool Usage | Tránh connection exhaustion | > 80%            |
| Redis Memory Usage       | Tránh OOM                   | > 80%            |
| Rate Limit Hits          | Phát hiện tấn công          | Spike bất thường |
| Failed Login Count       | Phát hiện brute-force       | > 50/phút        |

### 7.4 Audit Log cho Admin Actions

Mọi thao tác Admin (CRUD exam, khóa user, đổi role) nên được log vào bảng riêng hoặc external logging service:

```typescript
// Ví dụ audit log entry
{
  admin_id: 1,
  action: 'DELETE_EXAM_SET',
  target_id: 5,
  target_type: 'exam_set',
  details: { title: 'KET Practice Test 5' },
  ip_address: '1.2.3.4',
  timestamp: '2026-04-07T03:00:00Z'
}
```

---

## 8. Database Backup Strategy

**Không có backup = không có production.**

- **Automated Daily Backups:** Cấu hình managed MySQL provider (PlanetScale/Railway/RDS) tự động backup hàng ngày.
- **Retention:** Giữ ít nhất 7 ngày backup gần nhất.
- **Point-in-Time Recovery:** Bật binary logging để có thể restore đến bất kỳ thời điểm nào.
- **Test Restore:** Định kỳ (ít nhất 1 lần/tháng) test restore backup lên staging để đảm bảo backup thực sự hoạt động.
