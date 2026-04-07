# Data Validation Matrix

Bảng ma trận kiểm thử và quy tắc validation đầu vào (hậu kiểm BE và tiền kiểm FE) dùng thư viện `Zod` (TypeScript) cho hệ thống KET Practice. Đảm bảo an toàn Type-Safety cho toàn bộ quá trình API.

---

## 1. Authentication & System Rules

| Input / Payload | Tên trường     | Quy tắc Kiểm tra (Zod / Constraint)                                              | Error Hợp logic (User Friendly)                                                            |
| --------------- | -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Register/Login  | `email`        | `z.string().email().min(5).max(150)`                                             | "Định dạng email không hợp lệ."                                                            |
| Register        | `password`     | `z.string().min(8).max(72).regex(/[a-zA-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*]/)` | "Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ cái, 1 số và 1 ký tự đặc biệt (!@#$%^&\*)." |
| Register        | `full_name`    | `z.string().min(2).max(255).trim()`                                              | "Họ tên phải từ 2-255 ký tự."                                                              |
| Login           | `password`     | `z.string().min(1).max(72)`                                                      | "Vui lòng nhập mật khẩu." (Không cần validate format khi login — chỉ check khi register)   |
| Session Init    | `fingerprint`  | `z.string().min(10).max(255)` (Dạng chuỗi Base64 Hash). Bắt buộc có.             | "Fingerprint không hợp lệ." (400 Bad Request)                                              |
| Forgot Password | `email`        | `z.string().email().max(150)`                                                    | "Định dạng email không hợp lệ."                                                            |
| Reset Password  | `token`        | `z.string().length(64)` (Hex string 32 bytes)                                    | "Token không hợp lệ."                                                                      |
| Reset Password  | `new_password` | Cùng rules với Register `password`                                               | Cùng message với Register                                                                  |

> **Lưu ý quan trọng:**
>
> - `max(150)` cho email phải khớp với `VARCHAR(150)` trong Database Schema.
> - `max(72)` cho password vì bcrypt chỉ xử lý tối đa 72 bytes. Password dài hơn sẽ bị cắt ngầm → gây lỗi so khớp khó debug.
> - Nên kiểm tra password không nằm trong danh sách mật khẩu phổ biến (top 10,000 common passwords) ở layer Service.

---

## 2. API: Batch Answers (Submit đáp án lúc làm bài thi)

Để phòng chống Hack tool bypass FE gửi payload lên phá Database.
**Payload:** Array chứa các Object. Max Length Mảng = Số lượng câu hỏi của đề (tránh gửi mảng rác triệu array gây sập Redis/DB Parse).

| Cột                 | Quy tắc Validate (z.array/z.object)                                                                                             | Security Impact                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `answers` (Wrapper) | `z.array(...).min(1).max(70)` (KET tối đa ~60 câu)                                                                              | Chống DoS bằng cách nhồi payload mảng dài 1 triệu dòng. |
| `question_id`       | `z.number().positive().int()`                                                                                                   | Chống SQL Injection, Invalid Relation Type.             |
| `answer_json`       | `z.union([z.string().max(1000), z.record(z.string().max(500))])` — Object hoặc String. MCQ là `"A"\|"B"\|"C"`. JSON size < 1KB. | Chống nhồi mã độc XSS vào nội dung câu trả lời.         |

**Validation bổ sung ở layer Service:**

- Kiểm tra `question_id` thực sự thuộc exam của attempt đang làm (tránh ghi đáp án vào câu hỏi đề khác).
- Kiểm tra attempt `status = 'in_progress'` (không cho sửa bài đã nộp).

---

## 3. Quản trị Nội dung Đề Thi (Admin Create Exam Rules)

Rất nhiều lỗi hệ thống xuất phát từ Admin nhập nhầm cấu hình. Cần chặt chẽ Matrix:

| Cột / Dữ liệu           | Quy tắc Backend Kiểm Tra (DB Check)                                        | Mô tả Xử Lý                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Exam Set `title`        | `z.string().min(3).max(255).trim()`                                        | Tên đề thi không được để trống hoặc quá dài.                                                                           |
| Exam Set `slug`         | `z.string().regex(/^[a-z0-9-]+$/).min(3).max(255)`                         | Slug phải là format gạch ngang, VD: `ket-practice-test-1`. Không chứa Unicode hoặc dấu cách.                           |
| Exam `skill_type`       | `z.enum(['listening', 'reading_writing'])`                                 | Chỉ chấp nhận 2 giá trị hợp lệ.                                                                                        |
| Exam `duration_sec`     | `z.number().int().min(60).max(10800)`                                      | Hạn chế cấu hình sai thời gian thi. KET max khoảng 3 tiếng (10800s). Nếu điền nhầm 1 tỷ giây sẽ lỗi tràn bộ đếm Timer. |
| Part `order_index`      | `z.number().int().min(1).max(20)`                                          | Thứ tự part hợp lệ.                                                                                                    |
| Part `audio_url`        | `z.string().url().optional()`                                              | Nếu có, phải là URL hợp lệ.                                                                                            |
| Question `type`         | `z.enum(['mcq', 'fill_blank', 'matching'])`                                | Chỉ chấp nhận 3 loại câu hỏi.                                                                                          |
| Question `score_weight` | `z.number().int().min(1).max(10)`                                          | Điểm mỗi câu từ 1-10.                                                                                                  |
| Question `data_json`    | Xây dựng schema validate chặt chẽ dựa theo `type` (xem chi tiết bên dưới). | Đảm bảo hệ thống chấm Engine Backend không bị Undefined Error do Admin nhập thiếu đáp án chuẩn.                        |

### 3.1 Schema validate `data_json` theo Question Type

**MCQ (Multiple Choice Question):**

```typescript
const McqSchema = z
  .object({
    question: z.string().min(1).max(2000),
    options: z.array(z.string().min(1).max(500)).min(2).max(6),
    correct_answer: z.string().min(1),
    image_url: z.string().url().optional(),
  })
  .refine((data) => data.options.includes(data.correct_answer), {
    message: "correct_answer phải nằm trong danh sách options",
  });
```

**Fill in the Blank:**

```typescript
const FillBlankSchema = z.object({
  text_with_blanks: z.string().min(1).max(5000), // Dùng _____ đánh dấu chỗ trống
  correct_answers: z.array(z.string().min(1).max(200)).min(1),
});
```

**Matching:**

```typescript
const MatchingSchema = z.object({
  left_items: z.array(z.string().min(1).max(500)).min(2),
  right_items: z.array(z.string().min(1).max(500)).min(2),
  correct_pairs: z.record(z.string()), // { "A": "3", "B": "1" }
});
```

---

## 4. Logical Validation (Business Validation layer)

Các rules này không nằm ở layer Zod (Data format) mà nằm ở layer Service (Nghiệp vụ), truy vấn qua DB.

1. **Attempt Validation (Rule Thi Thử/Khoá Đề):**
   - `When:` Cố tình gửi POST API `/attempts/start` đề Reading & Writing.
   - `Condition:` Service Check trong CSDL xem "Listening ID cùng Set" đã có `status == 'submitted'` chưa.
   - `Action:` Throw 403 Forbidden Error. "Bạn phải hoàn thành kĩ năng Nghe trước khi qua Đọc - Viết."

2. **Exam Expiration (Hết Thời Gian):**
   - `When:` API `/answers/batch` được gửi về Server.
   - `Condition:` Lấy DB `expires_at` bù trừ thêm +120 giây (Mạng lag/đứt đoạn độ trễ). Nếu `Time_Now > Expires + 120s`.
   - `Action:` Chặn hành động Insert DB. Trả 403 `EXAM_EXPIRED`. Gửi Job Update Force Submission cho Bài Làm này ngay lập tức.

3. **Duplicate Attempt Prevention:**
   - `When:` User gửi POST `/attempts/start` cho exam đã có attempt `in_progress`.
   - `Condition:` Check DB xem có attempt nào `status = 'in_progress'` cho cùng `exam_id` + `account_id/anonymous_id`.
   - `Action:` Trả về attempt hiện tại thay vì tạo mới. Tránh tạo nhiều attempt rác.

4. **Owner Validation (Chống truy cập chéo):**
   - `When:` Mọi API liên quan đến attempt (`/answers/batch`, `/submit`, `/questions`, `/result`).
   - `Condition:` Check `attempt.account_id == session.user.id` (EXAM) hoặc `attempt.anonymous_id == cookie.anonymous_id` (PRACTICE).
   - `Action:` Nếu không khớp → 403 Forbidden. Ngăn user A xem/sửa bài của user B.

5. **Soft Delete Integrity:**
   - `When:` Admin xóa exam_set/exam/part/question.
   - `Condition:` Chỉ set `deleted_at = NOW()`, KHÔNG xóa cứng.
   - `Action:` Mọi query public phải filter `WHERE deleted_at IS NULL`. Admin CMS có thể xem cả items đã xóa.
