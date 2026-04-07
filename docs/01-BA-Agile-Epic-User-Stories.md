# BA Agile & User Stories

Tài liệu này định nghĩa cấu trúc phân rã công việc theo phương pháp Agile cho dự án KET Platform. Hệ thống chia thành 4 EPIC chính, ưu tiên phát triển theo từng Phase.

---

## Danh sách EPICs

- **[EPIC-01]** Quản trị Tài khoản & Phân quyền (Auth & Identity Engine)
- **[EPIC-02]** Quản trị Đề thi & Câu hỏi (Admin Content Engine)
- **[EPIC-03]** Phân hệ Ôn luyện Kỹ năng (Public Practice Engine)
- **[EPIC-04]** Phân hệ Thi thử & Chấm điểm (Mock Exam & Scoring Engine)

---

## Chi tiết User Stories

### [EPIC-01] Quản trị Tài khoản & Phân quyền

**US-01.01: Khởi tạo phiên ẩn danh (Anonymous Session)**

- **As a** Public User
- **I want to** hệ thống tự động khởi tạo và cấp cho tôi một `anonymous_id` khi tôi truy cập
- **So that** tôi có thể làm các bài ôn luyện mà không cần đăng ký tài khoản.
- **Acceptance Criteria (AC):**
  - **Given** User vào web lần đầu và không có `anonymous_id` trong cookie.
  - **When** Component mounted.
  - **Then** Gọi API sinh UUID, lưu xuống bảng `anonymous_sessions` DB, set vào HttpOnly cookie (server-side) và localStorage (backup FE).
  - **Then** Các API sau đọc `anonymous_id` từ HttpOnly cookie — KHÔNG từ request body (chống giả mạo).

**US-01.02: Đăng ký tài khoản**

- **As a** Learner (Học viên)
- **I want to** đăng ký tài khoản bằng Email/Password
- **So that** tôi có thể mở khóa phân hệ "Thi thử" và lưu trữ lịch sử điểm số lâu dài.
- **AC:**
  - Password phải validate: min 8 ký tự, ít nhất 1 chữ cái, 1 số, 1 ký tự đặc biệt (!@#$%^&\*).
  - Password được hash bằng bcrypt (cost factor ≥ 12) trước khi lưu DB. **KHÔNG BAO GIỜ** lưu plaintext.
  - Email phải unique. Trả lỗi 409 nếu đã tồn tại.
  - Sau đăng ký thành công → redirect tới trang Login.

**US-01.03: Đăng nhập tài khoản**

- **As a** Learner
- **I want to** đăng nhập qua Email/Password
- **So that** tôi truy cập được phân hệ Thi thử.
- **AC:**
  - Sử dụng NextAuth.js để cấp session JWT (HttpOnly, SameSite=Lax, Secure cookie).
  - Nếu sai password 5 lần liên tiếp → khóa tài khoản 15 phút (Account Lockout).
  - Hiển thị cảnh báo "Còn N lượt thử" từ lần sai thứ 3.
  - Khi bị khóa → hiển thị thông báo kèm thời gian mở khóa và link "Quên mật khẩu".

**US-01.04: Đăng nhập Admin**

- **As an** Administrator
- **I want to** đăng nhập vào trang CMS
- **So that** tôi có thể quản lý nội dung đề thi.
- **AC:**
  - Role bảo mật truy cập route `/admin/*`. Tự động redirect về `/login` nếu chưa login.
  - Chỉ `role = 'admin'` mới truy cập được. User/Teacher → 403 Forbidden.

**US-01.05: Quên mật khẩu (Forgot Password)**

- **As a** Learner
- **I want to** đặt lại mật khẩu khi quên
- **So that** tôi không bị mất tài khoản vĩnh viễn.
- **AC:**
  - Nhập email → hệ thống gửi email chứa link reset (token hết hạn sau 1 giờ).
  - Luôn trả response 200 dù email có tồn tại hay không (tránh leak thông tin).
  - Token được hash SHA-256 trước khi lưu DB (không lưu raw token).
  - Sau reset thành công → clear trạng thái lockout (nếu có) và redirect tới Login.
  - Rate limit: 3 req/giờ/email.

**US-01.06: Đăng xuất**

- **As a** Learner / Admin
- **I want to** đăng xuất khỏi hệ thống
- **So that** phiên làm việc của tôi được kết thúc an toàn.
- **AC:**
  - Xóa session cookie.
  - Redirect về trang chủ.

**US-01.07: Quản lý hồ sơ cá nhân**

- **As a** Learner
- **I want to** cập nhật họ tên, avatar, số điện thoại
- **So that** thông tin cá nhân của tôi luôn chính xác.
- **AC:**
  - Chỉ user đã login mới truy cập được trang Profile.
  - Validate: full_name (2-255 ký tự), phone_number (format VN), avatar_url (URL hợp lệ hoặc upload file).

---

### [EPIC-02] Quản trị Đề thi & Câu hỏi (Admin)

**US-02.01: Quản lý Exam Sets (Nhóm đề)**

- **As an** Admin
- **I want to** tạo một Exam Set (VD: KET Practice Test 1)
- **So that** tôi có thể nhóm phần Listening và Reading & Writing vào chung 1 đề.
- **AC:**
  - Admin có thể Tạo, Sửa, Bật/Tắt Trạng thái (Publish/Draft).
  - Xóa sử dụng Soft Delete (`deleted_at`) — không xóa cứng để bảo toàn lịch sử thi.
  - Slug phải unique, format `[a-z0-9-]+`.
  - Mọi thao tác CUD phải invalidate Redis cache và ISR cache.

**US-02.02: Soạn thảo câu hỏi JSON (Dynamic)**

- **As an** Admin
- **I want to** nhập nội dung câu hỏi dưới dạng cấu trúc đa dạng (MCQ, Fill in Blank, Matching)
- **So that** hệ thống hỗ trợ đầy đủ các format thi KET thực tế.
- **AC:**
  - Giao diện Admin có Form builder lưu dữ liệu thành cục `data_json`.
  - Validate cấu trúc JSON hợp lệ trước khi save (Zod schema theo question type).
  - MCQ: `correct_answer` phải nằm trong danh sách `options`.
  - Fill Blank: phải có ít nhất 1 `correct_answer`.
  - Matching: số lượng `left_items` và `right_items` phải >= 2.

**US-02.03: Quản lý Users (Admin)**

- **As an** Admin
- **I want to** xem danh sách users, khóa/mở tài khoản, đổi role
- **So that** tôi kiểm soát được quyền truy cập hệ thống.
- **AC:**
  - Danh sách users có phân trang.
  - Có thể toggle `is_active` (khóa/mở).
  - Có thể đổi role (`user`, `teacher`, `admin`).
  - Không thể tự khóa chính mình.

---

### [EPIC-03] Phân hệ Ôn luyện Kỹ năng (Public)

**US-03.01: Truy cập Bài Ôn luyện theo Kỹ năng**

- **As a** Public User
- **I want to** vào Sidebar, chọn phần "Luyện nghe" hoặc "Luyện đọc"
- **So that** tôi bấm vào làm ngay lập tức, không bị gián đoạn bởi form đăng nhập.
- **AC:**
  - Record `attempt` được tạo với `anonymous_id` (đọc từ cookie). Mode của attempt này là `PRACTICE`.
  - Nếu đã có attempt `in_progress` cho cùng exam → trả về attempt hiện tại thay vì tạo mới.

**US-03.02: Nhận kết quả câu hỏi tức thời (Immediate Feedback)**

- **As a** Public User
- **I want to** biết ngay câu đó đúng hay sai sau khi bấm "Kiểm tra đáp án"
- **So that** tôi rút kinh nghiệm trực tiếp lúc ôn luyện.
- **AC:** Chế độ PRACTICE cho phép gọi API chấm chéo từng câu, hiển thị Xanh/Đỏ và Giải thích (Explanation).

---

### [EPIC-04] Phân hệ Thi thử & Chấm điểm (Exam)

**US-04.01: Khóa bài thi khi chưa Đăng nhập**

- **As a** Learner / Public User
- **I want to** thấy icon "Khóa" ở các Bài Thi Thử
- **So that** tôi biết mình phải tạo tài khoản để làm bài thi mô phỏng thật.
- **AC:** Click vào bài thi đang khóa sẽ pop-up yêu cầu Đăng nhập.

**US-04.02: Trải nghiệm phòng thi (Exam Room)**

- **As a** Logged-in Learner
- **I want to** có UX phòng thi tĩnh, không có navbar thừa, có đồng hồ đếm ngược 30 phút (Listening)
- **So that** tôi tập trung tối đa và cảm nhận áp lực thời gian.
- **AC:**
  - Sidebar trái auto collapsed.
  - Bộ đếm local, sync offset với server `expires_at`.
  - Hết giờ tự động force `Submit` (server-side validation `expires_at + 120s grace`).
  - Chống cheat thời gian: Timer dựa trên server time, không phải client time.

**US-04.03: Auto-save bài làm (Phòng chống rủi ro)**

- **As a** Learner
- **I want to** câu trả lời của tôi được tự động lưu nền (background sync)
- **So that** nếu tôi lỡ tay F5 hoặc mất điện, tôi vẫn có thể resume bài làm.
- **AC:**
  - Debounce 30s hoặc mỗi khi chuyển Part sẽ trigger API `/answers/batch`.
  - UI hiển thị trạng thái "Đã lưu lúc HH:MM" hoặc "Đang lưu..." hoặc "Lưu thất bại — Thử lại".
  - Nếu auto-save fail (mất mạng) → hiển thị cảnh báo và retry tự động.

**US-04.04: Chấm điểm bài thi (Scoring Engine)**

- **As a** Learner
- **I want to** xem tổng điểm và phân tích điểm từng phần sau thao tác "Nộp bài"
- **So that** tôi đánh giá được mình yếu kỹ năng nào.
- **AC:**
  - BE tính điểm server-side dựa trên `score_weight`.
  - **KHÔNG leak `correct_answer` xuống Client ở chế độ EXAM** cho đến khi đã submit.
  - Sau submit: hiển thị score breakdown theo từng Part, đáp án đúng và giải thích.

**US-04.05: Xem lịch sử thi**

- **As a** Learner
- **I want to** xem danh sách các lượt thi đã hoàn thành và điểm số
- **So that** tôi theo dõi được tiến trình học tập của mình.
- **AC:**
  - Danh sách có phân trang, sắp xếp theo thời gian mới nhất.
  - Mỗi item hiển thị: tên đề, kỹ năng, điểm, thời gian thi.
  - Click vào item → xem chi tiết kết quả (đáp án đúng/sai, giải thích).

**US-04.06: Khóa đề Reading & Writing cho đến khi hoàn thành Listening**

- **As a** Learner
- **I want to** hệ thống bắt buộc tôi làm Listening trước
- **So that** trải nghiệm thi mô phỏng đúng thứ tự thi KET thực tế.
- **AC:**
  - Card Reading & Writing hiển thị Disabled + Tooltip "Vui lòng hoàn thành Listening trước".
  - API `/attempts/start` cho Reading & Writing check DB: Listening cùng exam_set phải có `status = 'submitted'`.
  - Nếu chưa → 403 Forbidden.
