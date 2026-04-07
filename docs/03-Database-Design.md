# Database Schema & Details (MySQL 8.0+)

Tài liệu này định nghĩa chi tiết cấu trúc Database chuẩn hóa cho nền tảng KET Platform với mô hình Hybrid Auth (Public Practice + Private Exam).

---

## Tổng quan Thiết kế

- **DBMS:** MySQL 8.0.16+ (Bắt buộc để hỗ trợ `CHECK` constraint & JSON features).
- **Engine:** InnoDB.
- **Collation:** `utf8mb4_unicode_ci` (Hỗ trợ đa ngôn ngữ và Emoji).
- **Timezone:** UTC (`TIMESTAMPTZ` logic được map qua timestamp default MySQL).
- **Soft Delete:** Các bảng content (`exam_sets`, `exams`, `parts`, `questions`) sử dụng cột `deleted_at` thay vì xóa cứng, đảm bảo không mất dữ liệu lịch sử khi Admin xóa nội dung.

---

## Data Dictionary

### Bảng 1: `accounts` (Định danh người dùng & Admin)

| Cột                      | Data Type    | Attributes                                            | Ghi chú / Ý nghĩa                                                                 |
| ------------------------ | ------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `id`                     | INT          | PK, AUTO_INCREMENT                                    | ID Tài khoản                                                                      |
| `email`                  | VARCHAR(150) | UNIQUE, NOT NULL                                      | Dùng để đăng nhập                                                                 |
| `password_hash`          | VARCHAR(255) | NOT NULL                                              | Hash bằng Bcrypt (cost factor ≥ 12). **KHÔNG BAO GIỜ** lưu plaintext.             |
| `role`                   | VARCHAR(20)  | NOT NULL, DEFAULT 'user'                              | Giá trị hợp lệ: `'admin'`, `'user'`, `'teacher'` (Ràng buộc bởi CHECK constraint) |
| `is_active`              | BOOLEAN      | DEFAULT TRUE                                          | Khóa/Mở tài khoản                                                                 |
| `email_verified`         | BOOLEAN      | DEFAULT FALSE                                         | Trạng thái xác thực email                                                         |
| `failed_login_count`     | INT          | DEFAULT 0                                             | Đếm số lần đăng nhập sai liên tiếp (reset về 0 khi login thành công)              |
| `locked_until`           | TIMESTAMP    | NULLABLE                                              | Thời điểm mở khóa tài khoản. Nếu `NOW() < locked_until` → từ chối login.          |
| `password_reset_token`   | VARCHAR(255) | NULLABLE                                              | Token hash (SHA-256) dùng cho flow Forgot Password                                |
| `password_reset_expires` | TIMESTAMP    | NULLABLE                                              | Thời hạn token reset (mặc định +1 giờ)                                            |
| `last_login_at`          | TIMESTAMP    | NULLABLE                                              | Lần đăng nhập thành công gần nhất                                                 |
| `created_at`             | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                             |                                                                                   |
| `updated_at`             | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                                                   |

**Constraint bảo vệ Role:**

```sql
ALTER TABLE accounts ADD CONSTRAINT chk_account_role
CHECK (role IN ('admin', 'user', 'teacher'));
```

### Bảng 2: `account_info` (Hồ sơ người dùng)

Tách riêng để giữ size query của `accounts` nhỏ nhất khi dùng NextAuth.
| Cột | Data Type | Attributes | Ghi chú |
|---|---|---|---|
| `id` | INT | PK, AI | |
| `account_id` | INT | UNIQUE, FK | FK trỏ tới `accounts.id` |
| `full_name` | VARCHAR(255) | | |
| `avatar_url` | TEXT | | |
| `phone_number`| VARCHAR(20) | | |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### Bảng 3: `anonymous_sessions` (Phiên ẩn danh cho Ôn luyện)

| Cột           | Data Type    | Attributes                | Ghi chú / Ý nghĩa                   |
| ------------- | ------------ | ------------------------- | ----------------------------------- |
| `id`          | VARCHAR(36)  | PK                        | Sinh bằng UUID v4 ở Backend         |
| `ip_address`  | VARCHAR(45)  |                           | Lưu IP để rate limiting / chặn spam |
| `fingerprint` | VARCHAR(255) |                           | Client device fingerprint           |
| `created_at`  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |                                     |
| `expires_at`  | TIMESTAMP    |                           | Ngày hết hạn (Mặc định +7 ngày)     |

### Bảng 4: `exam_sets` (Nhóm đề thi VD: KET 1, KET 2)

| Cột            | Data Type    | Attributes                                            | Ghi chú                                                        |
| -------------- | ------------ | ----------------------------------------------------- | -------------------------------------------------------------- |
| `id`           | INT          | PK, AI                                                |                                                                |
| `title`        | VARCHAR(255) | NOT NULL                                              | "KET Practice Test 1"                                          |
| `slug`         | VARCHAR(255) | UNIQUE                                                | Dùng cho NextJS Routing (`/thi-thu/ket-1`)                     |
| `is_published` | BOOLEAN      | DEFAULT FALSE                                         | Publish mới show ra UI                                         |
| `created_at`   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                             |                                                                |
| `updated_at`   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                                                |
| `deleted_at`   | TIMESTAMP    | NULLABLE, DEFAULT NULL                                | Soft delete — query mặc định filter `WHERE deleted_at IS NULL` |

### Bảng 5: `exams` (Đề lẻ của KET - Listening / Reading & Writing)

| Cột            | Data Type   | Attributes                                            | Ghi chú                                  |
| -------------- | ----------- | ----------------------------------------------------- | ---------------------------------------- |
| `id`           | INT         | PK, AI                                                |                                          |
| `exam_set_id`  | INT         | FK                                                    | Trỏ tới `exam_sets.id`                   |
| `skill_type`   | VARCHAR(50) | NOT NULL                                              | `'listening'`, `'reading_writing'`       |
| `duration_sec` | INT         | NOT NULL                                              | Thời gian thi tính bằng Giây (vd: 1800s) |
| `created_at`   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP                             |                                          |
| `updated_at`   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                          |
| `deleted_at`   | TIMESTAMP   | NULLABLE, DEFAULT NULL                                | Soft delete                              |

**Constraint bảo vệ Skill Type:**

```sql
ALTER TABLE exams ADD CONSTRAINT chk_exam_skill
CHECK (skill_type IN ('listening', 'reading_writing'));
```

### Bảng 6: `parts` (Phần thi)

| Cột           | Data Type    | Attributes                                            | Ghi chú                            |
| ------------- | ------------ | ----------------------------------------------------- | ---------------------------------- |
| `id`          | INT          | PK, AI                                                |                                    |
| `exam_id`     | INT          | FK                                                    |                                    |
| `order_index` | INT          | NOT NULL                                              | Thứ tự (Part 1, Part 2)            |
| `title`       | VARCHAR(255) |                                                       | "Part 1 - 5 questions"             |
| `instruction` | TEXT         |                                                       | Lời dẫn làm part này               |
| `audio_url`   | TEXT         |                                                       | Link S3/Supabase cho bài Listening |
| `created_at`  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP                             |                                    |
| `updated_at`  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                    |
| `deleted_at`  | TIMESTAMP    | NULLABLE, DEFAULT NULL                                | Soft delete                        |

### Bảng 7: `questions` (Câu hỏi)

| Cột            | Data Type   | Attributes                                            | Ghi chú                            |
| -------------- | ----------- | ----------------------------------------------------- | ---------------------------------- |
| `id`           | INT         | PK, AI                                                |                                    |
| `part_id`      | INT         | FK                                                    |                                    |
| `order_index`  | INT         |                                                       | Số thứ tự câu (Câu 1, B)           |
| `type`         | VARCHAR(50) | NOT NULL                                              | `mcq`, `fill_blank`, `matching`    |
| `data_json`    | JSON        | NOT NULL                                              | Payload đề + Đáp án chuẩn của câu  |
| `score_weight` | INT         | DEFAULT 1                                             | Điểm của câu (nếu là dạng câu khó) |
| `explanation`  | TEXT        |                                                       | Giải thích chi tiết đáp án         |
| `created_at`   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP                             |                                    |
| `updated_at`   | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |                                    |
| `deleted_at`   | TIMESTAMP   | NULLABLE, DEFAULT NULL                                | Soft delete                        |

**Constraint bảo vệ Question Type:**

```sql
ALTER TABLE questions ADD CONSTRAINT chk_question_type
CHECK (type IN ('mcq', 'fill_blank', 'matching'));
```

### Bảng 8: `attempts` (Lượt làm bài)

**Bảng Cốt lõi của Hybrid Model.**
| Cột | Data Type | Attributes | Ghi chú |
|---|---|---|---|
| `id` | INT | PK, AI | ID Lượt làm bài |
| `mode` | VARCHAR(20) | NOT NULL | `'PRACTICE'` (Ôn luyện) hoặc `'EXAM'` (Thi) |
| `exam_id` | INT | FK | ID Đề đang làm |
| `account_id` | INT | FK, NULLABLE | Tài khoản đang làm (nếu mode=EXAM) |
| `anonymous_id`| VARCHAR(36)| FK, NULLABLE | UUID phiên (nếu mode=PRACTICE) |
| `status` | VARCHAR(20) | NOT NULL | `'in_progress'`, `'submitted'`, `'expired'` |
| `started_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | |
| `submitted_at`| TIMESTAMP | NULLABLE | Thời điểm user nộp bài (hoặc hệ thống force submit) |
| `expires_at` | TIMESTAMP | | = started_at + exam.duration_sec |
| `total_score` | INT | NULLABLE | Điểm được build sau khi submit |
| `score_json` | JSON | NULLABLE | Break down từng phần (Phục vụ biểu đồ radar) |

**Constraint Ràng buộc Mode Logic:**

```sql
ALTER TABLE attempts ADD CONSTRAINT chk_attempt_auth
CHECK (
  (mode = 'EXAM' AND account_id IS NOT NULL) OR
  (mode = 'PRACTICE' AND anonymous_id IS NOT NULL)
);

ALTER TABLE attempts ADD CONSTRAINT chk_attempt_mode
CHECK (mode IN ('EXAM', 'PRACTICE'));

ALTER TABLE attempts ADD CONSTRAINT chk_attempt_status
CHECK (status IN ('in_progress', 'submitted', 'expired'));
```

### Bảng 9: `answers` (Đáp án học viên submit)

| Cột              | Data Type | Attributes                                            | Ghi chú                            |
| ---------------- | --------- | ----------------------------------------------------- | ---------------------------------- |
| `id`             | INT       | PK, AI                                                |                                    |
| `attempt_id`     | INT       | FK                                                    |                                    |
| `question_id`    | INT       | FK                                                    |                                    |
| `answer_json`    | JSON      | NOT NULL                                              | Câu trả lời của user lưu dạng JSON |
| `is_correct`     | BOOLEAN   | NULLABLE                                              | Tính được sau chấm                 |
| `score_achieved` | INT       | NULLABLE                                              | Tính được sau chấm                 |
| `created_at`     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP                             |                                    |
| `updated_at`     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last modified do auto-save         |

---

## Indexing Strategies (Tối ưu truy vấn MySQL)

Để tránh bottle-neck lúc nhiều học viên vào làm bài đồng loạt:

### Indexes cho bảng `attempts` (Truy vấn lượt làm bài)

```sql
-- Giúp Dashboard load "Các bài đang làm dở" nhanh chóng
CREATE INDEX idx_attempt_acc ON attempts(account_id, status);
CREATE INDEX idx_attempt_anon ON attempts(anonymous_id, status);
```

### Indexes cho bảng `answers` (Tránh duplicate + tăng tốc lookup)

```sql
-- Tránh 1 attempt cho 1 câu hỏi lại có 2 bản record. Hỗ trợ INSERT ... ON DUPLICATE KEY UPDATE (Auto-save)
CREATE UNIQUE INDEX idx_uniq_answer ON answers(attempt_id, question_id);
```

### Indexes cho bảng `anonymous_sessions` (Cleanup job)

```sql
-- Phục vụ Worker Job quét và XÓA sessions rác hiệu suất cao
CREATE INDEX idx_session_exp ON anonymous_sessions(expires_at);
```

### Indexes cho Foreign Key Lookups (Tăng tốc JOIN queries)

```sql
-- Load parts theo exam
CREATE INDEX idx_parts_exam ON parts(exam_id);

-- Load questions theo part
CREATE INDEX idx_questions_part ON questions(part_id);

-- Load exams theo exam_set
CREATE INDEX idx_exams_set ON exams(exam_set_id);

-- Load attempts theo exam (thống kê, analytics)
CREATE INDEX idx_attempts_exam ON attempts(exam_id);
```

### Indexes cho Soft Delete Queries

```sql
-- Tối ưu query filter deleted_at IS NULL (dùng thường xuyên)
CREATE INDEX idx_exam_sets_deleted ON exam_sets(deleted_at);
CREATE INDEX idx_exams_deleted ON exams(deleted_at);
CREATE INDEX idx_parts_deleted ON parts(deleted_at);
CREATE INDEX idx_questions_deleted ON questions(deleted_at);
```
