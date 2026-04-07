# Business Flows & Sequence Diagrams

Tài liệu này minh họa luồng nghiệp vụ (Business Flow) và biểu đồ trình tự (Sequence Diagram) cho các quy trình cốt lõi của hệ thống KET Platform.

---

## 1. Luồng Kinh Doanh (Business Flows)

### 1.1. Luồng Ôn luyện Kỹ năng (Practice Flow - Public)

```mermaid
flowchart TD
    A[Public User truy cập Web] --> B{Có Anonymous ID trong cookie?}
    B -- Không --> C[API Sinh và lưu Anonymous ID]
    B -- Có --> D[Dashboard]
    C --> D
    D --> E[Chọn mục: Luyện Nghe / Luyện Đọc]
    E --> F[Chọn 1 Part để luyện]
    F --> G[Tạo Attempt mode: PRACTICE]
    G --> H[Làm bài & Chọn đáp án]
    H --> I[Bấm 'Check' / Kiểm tra ngay]
    I --> J[Hệ thống chấm điểm tức thời]
    J --> K[Hiển thị Đúng/Sai & Giải thích]
```

### 1.2. Luồng Thi Thử (Mock Exam Flow - Private)

```mermaid
flowchart TD
    A[User vào Web] --> B[Sidebar: Chọn Thi thử KET]
    B --> C{Đã Login?}
    C -- Chưa --> D[Redirect tới Đăng nhập]
    D --> E[Login thành công]
    C -- Rồi --> F[Trang thông tin Exam Set KET]
    E --> F
    F --> G[Chọn Listening - Phải làm trước]
    G --> H[Tạo Attempt mode: EXAM có Account ID]
    H --> I[Bắt đầu đếm ngược 30 phút]
    I --> J[Làm bài - Auto Save ngầm]
    J --> K{Nộp bài tự nguyện?}
    K -- Yes --> M[Calculate Score]
    J --> L{Hết giờ?}
    L -- Yes --> M
    M --> N[Khóa Listening, Mở khóa Reading & Writing]
```

### 1.3. Luồng Đăng ký Tài khoản (Registration Flow)

```mermaid
flowchart TD
    A[User bấm Đăng ký] --> B[Nhập Email, Password, Họ tên]
    B --> C{Validate FE}
    C -- Lỗi --> D[Hiển thị lỗi validation]
    C -- OK --> E[POST /api/auth/register]
    E --> F{Email đã tồn tại?}
    F -- Có --> G[Trả lỗi 409 Conflict]
    F -- Không --> H[Hash password bcrypt]
    H --> I[INSERT accounts + account_info]
    I --> J[Trả 201 Created]
    J --> K[Redirect tới Login]
```

### 1.4. Luồng Quên Mật Khẩu (Forgot Password Flow)

```mermaid
flowchart TD
    A[User bấm 'Quên mật khẩu'] --> B[Nhập Email]
    B --> C[POST /api/auth/forgot-password]
    C --> D{Email tồn tại?}
    D -- Không --> E[Vẫn trả 200 - tránh leak info]
    D -- Có --> F[Sinh token random 32 bytes]
    F --> G[Hash SHA-256, lưu DB + expires 1h]
    G --> H[Gửi email chứa link reset]
    H --> E
    E --> I[UI: 'Kiểm tra email của bạn']
    I --> J[User click link trong email]
    J --> K[Trang Reset Password]
    K --> L[Nhập mật khẩu mới]
    L --> M[POST /api/auth/reset-password]
    M --> N{Token hợp lệ & chưa hết hạn?}
    N -- Không --> O[Trả lỗi 400]
    N -- Có --> P[Hash password mới, update DB]
    P --> Q[Clear token + lockout state]
    Q --> R[Redirect tới Login]
```

---

## 2. Sequence Diagrams (Biểu đồ tuần tự)

### 2.1. Khởi tạo phiên ẩn danh (Bảo mật Anonymous ID)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API as Next Route (/api/sessions/init)
    participant Redis as Redis Cache
    participant DB as MySQL DB

    User->>Browser: Mở trang chủ KET
    Browser->>Browser: Check cookie 'anonymous_id'
    alt Missing ID
        Browser->>API: POST /api/sessions/init { fingerprint }
        API->>Redis: Check Rate Limit IP (10 req/giờ)
        alt Bị limit
            Redis-->>API: Reject
            API-->>Browser: 429 Too Many Requests
        else Hợp lệ
            API->>API: Validate fingerprint (required, max 255)
            API->>DB: INSERT INTO anonymous_sessions (UUID v4)
            DB-->>API: Success
            API-->>Browser: HTTP 200 { anonymous_id } + Set-Cookie HttpOnly
            Browser->>Browser: Lưu localStorage (backup) + Cookie đã set
        end
    end
```

> **⚠️ Lưu ý bảo mật:** Server set `anonymous_id` vào HttpOnly cookie. Các API sau đọc từ cookie — KHÔNG tin client gửi trong request body.

### 2.2. Login (NextAuth JS) với Account Lockout

```mermaid
sequenceDiagram
    participant User
    participant NextJS Frontend
    participant NextAuth API
    participant MySQL

    User->>NextJS Frontend: Nhập Email/Pass (Submit)
    NextJS Frontend->>NextAuth API: POST /api/auth/callback/credentials
    NextAuth API->>MySQL: SELECT * FROM accounts WHERE email = ?
    MySQL-->>NextAuth API: Account record

    alt Tài khoản bị khóa (locked_until > NOW)
        NextAuth API-->>NextJS Frontend: 423 Locked (retry_after timestamp)
        NextJS Frontend->>User: "Tài khoản bị khóa. Thử lại sau 15 phút."
    else Tài khoản active
        NextAuth API->>NextAuth API: bcrypt.compare(password, hash)
        alt Sai Password
            NextAuth API->>MySQL: UPDATE failed_login_count += 1
            alt failed_login_count >= 5
                NextAuth API->>MySQL: SET locked_until = NOW() + 15min
                NextAuth API-->>NextJS Frontend: 423 Locked
            else Còn lượt thử
                NextAuth API-->>NextJS Frontend: 401 Unauthorized (còn N lượt)
            end
        else Đúng Password
            NextAuth API->>MySQL: RESET failed_login_count=0, locked_until=NULL, last_login_at=NOW()
            NextAuth API-->>NextJS Frontend: Set-Cookie (Session JWT HttpOnly)
            NextJS Frontend->>User: Redirect to /thi-thu/ket-1
        end
    end
```

### 2.3. Đăng ký tài khoản (Register)

```mermaid
sequenceDiagram
    participant User
    participant FE as NextJS Frontend
    participant API as Route Handler (/api/auth/register)
    participant DB as MySQL

    User->>FE: Nhập Email, Password, Họ tên
    FE->>FE: Validate Zod (email, password rules)
    FE->>API: POST /api/auth/register { email, password, full_name }
    API->>API: Server-side Zod validate
    API->>DB: SELECT id FROM accounts WHERE email = ?
    alt Email đã tồn tại
        DB-->>API: Record found
        API-->>FE: 409 Conflict "Email đã được sử dụng"
    else Email mới
        API->>API: bcrypt.hash(password, 12)
        API->>DB: INSERT INTO accounts (email, password_hash, role='user')
        API->>DB: INSERT INTO account_info (account_id, full_name)
        DB-->>API: Success
        API-->>FE: 201 Created
        FE->>User: "Đăng ký thành công!" → Redirect Login
    end
```

### 2.4. Logic Auto-save & Submit bài thi

```mermaid
sequenceDiagram
    participant Learner
    participant FE as State (Zustand)
    participant BE as Route Handler (/api/attempts)
    participant DB as MySQL

    Learner->>FE: Chọn Option B (Câu 1)
    FE->>FE: Update local store (answers)

    note over FE,BE: BACKGROUND: Debounce mỗi 30s
    FE->>BE: POST /api/attempts/:id/answers/batch (JSON)
    BE->>BE: Check Owner (account_id/anonymous_id khớp)
    BE->>BE: Check Expires Time (expires_at + 120s grace)
    alt Quá hạn
        BE-->>FE: 403 EXAM_EXPIRED
        BE->>DB: Force UPDATE status='submitted', submitted_at=NOW()
        FE->>Learner: "Bài thi đã hết giờ. Đáp án đã được lưu."
    else Còn thời gian
        BE->>DB: INSERT ... ON DUPLICATE KEY UPDATE (Batch Save)
        DB-->>BE: Saved
        BE-->>FE: 200 OK { saved_count, last_saved_at }
        FE->>Learner: UI Update "Đã lưu lúc 10:45:00"
    end

    Learner->>FE: Bấm Nộp Bài (Submit)
    FE->>BE: POST /api/attempts/:id/submit
    BE->>BE: Check Owner
    BE->>DB: Get All Answers of Attempt
    BE->>BE: Scoring Engine (so khớp answer_json vs data_json.correct_answer)
    BE->>DB: UPDATE attempt SET status='submitted', submitted_at=NOW(), total_score=X, score_json={...}
    DB-->>BE: Done
    BE-->>FE: HTTP 200 { total_score, score_breakdown }
    FE->>Learner: Redirect trang Kết quả
```

### 2.5. Quên mật khẩu (Forgot Password)

```mermaid
sequenceDiagram
    participant User
    participant FE as NextJS Frontend
    participant API as Route Handler
    participant DB as MySQL
    participant Email as Email Service

    User->>FE: Bấm "Quên mật khẩu", nhập email
    FE->>API: POST /api/auth/forgot-password { email }
    API->>DB: SELECT id FROM accounts WHERE email = ?
    alt Email không tồn tại
        API-->>FE: 200 OK (message chung - tránh leak)
    else Email tồn tại
        API->>API: Sinh random token (32 bytes hex)
        API->>API: SHA-256 hash token
        API->>DB: UPDATE accounts SET password_reset_token=hash, password_reset_expires=NOW()+1h
        API->>Email: Gửi email chứa link reset (raw token)
        API-->>FE: 200 OK (message chung)
    end
    FE->>User: "Kiểm tra email của bạn"

    User->>FE: Click link trong email, nhập password mới
    FE->>API: POST /api/auth/reset-password { email, token, new_password }
    API->>API: SHA-256 hash token từ request
    API->>DB: SELECT * WHERE email=? AND password_reset_token=hash AND password_reset_expires > NOW()
    alt Token invalid hoặc hết hạn
        API-->>FE: 400 "Token không hợp lệ hoặc đã hết hạn"
    else Token hợp lệ
        API->>API: bcrypt.hash(new_password, 12)
        API->>DB: UPDATE password_hash, CLEAR reset_token + reset_expires + failed_login_count + locked_until
        API-->>FE: 200 "Đặt lại mật khẩu thành công"
        FE->>User: Redirect tới Login
    end
```

### 2.6. Xử lý Anonymous Session hết hạn giữa chừng

```mermaid
sequenceDiagram
    participant User
    participant FE as NextJS Frontend
    participant API as Route Handler
    participant DB as MySQL

    User->>FE: Đang làm bài Practice (anonymous)
    FE->>API: POST /api/attempts/:id/answers/batch
    API->>DB: Check anonymous_sessions WHERE id = cookie.anonymous_id
    alt Session đã hết hạn (expires_at < NOW)
        API->>API: Tạo session mới (extend)
        API->>DB: UPDATE anonymous_sessions SET expires_at = NOW() + 7 days
        Note over API: Giữ nguyên anonymous_id, chỉ gia hạn
        API->>DB: Save answers bình thường
        API-->>FE: 200 OK
    else Session còn hạn
        API->>DB: Save answers bình thường
        API-->>FE: 200 OK
    end
```
