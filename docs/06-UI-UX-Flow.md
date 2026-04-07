# Phân tích UI/UX Flow & Wireframes

Tài liệu thiết kế cấu trúc màn hình (Screen Flow) và trải nghiệm người dùng tối ưu hóa cho hệ thống KET Practice & Mock Exam.

---

## 1. Cấu trúc UI Layout (Sidebar Trái)

Triết lý thiết kế: Tối đa hóa không gian Focus.

- **Trạng thái PC (Desktop):** Sidebar expand width 240px.
- **Trạng thái Thi (Exam Mode):** Auto-collapse Sidebar thành dạng chỉ có Icon (Width 64px). Dành 95% diện tích màn hình cho bài Reading (vì cần đọc đoạn văn dài) và Listening (Cần view nhiều hình ảnh A/B/C).
- **Mobile (Responsive):** Ẩn Sidebar bằng Hamburger Drawer Panel.
- **Tablet:** Sidebar collapse mặc định, có thể expand bằng gesture swipe hoặc nút toggle.

---

## 2. Screen Flow Chart (Luồng màn hình)

### 2.1. Home & Dashboard

🔹 **Main Content:** Hiển thị 2 Tab/Section khổng lồ.

- Mục 1: **Đề thi Thử KET (Cockpit)** - Khóa hoặc Mở tùy Auth. Hiển thị % tiến độ thi.
- Mục 2: **Ôn tập Public** - Luyện từng kỹ năng (Listening, Grammar).

### 2.2. Trang Chi tiết Đề thi (Exam Set Detail - `/thi-thu/ket-[id]`)

🔹 **UX Structure:**

- **Header Banner:** Hình ảnh mô phỏng chứng chỉ Cambridge, tên bài "KET Practice Test 1".
- **Split Layout:**
  - Cột Phải: Thông tin cá nhân, Lịch sử thi cũ của tài khoản.
  - Cột Trái (Main): 2 Card to bự tương ứng với 2 kỹ năng.
    - Card 1: **Listening** (30 mins). Call To Action: "Bắt đầu làm".
    - Card 2: **Reading & Writing** (70 mins). Giao diện Disabled khóa mờ. Tooltip ghi _"Vui lòng hoàn thành Listening trước"_.

### 2.3. Trải nghiệm Phòng thi (Exam Room - `/lam-bai/[attempt]`)

Đây là khu vực quan trọng nhất về mặt UI/UX. Hệ thống Zustand giữ trạng thái.

- **Top Sticky Bar:**
  - Trái: Button "Thoát (Bảo lưu)".
  - Giữa: Đồng hồ SVG đếm ngược. Chuyển Xanh 🟢 → Cam 🟠 (<5 phút) → Đỏ rung lắc 🔴 (30s cuối).
  - Phải: Nút "Nộp Bài Ngay" nổi bật. Nút nhỏ lưu trạng thái: _"Đã lưu online lúc 10:25"_.
- **Main Area (Split Screen for Reading):**
  - Khung Đọc (Left 40%): Cố định text đọc hiểu chứa scroll dọc riêng.
  - Khung Trả lời (Right 60%): Cuộn qua từng câu hỏi MCQ.
- **Bottom Bar (Navigator):**
  - Dải ô vuông đại diện cho 50 câu (Câu 1, 2, ..., 50).
  - Trạng thái Ô: Trắng (Chưa làm), Xanh (Đã tick đáp án), Cắm Cờ Vàng (Flagged để dò lại).

### 2.4. Màn hình Kết Quả (Result Score / Breakdown)

Sau khi bấm Submit → Cuddle confetti effect (hiệu ứng pháo giấy nhẹ nhàng) nếu Pass (>120 điểm chuẩn Cambridge KET).

- UI Hiển thị:
  - Vòng tròn đồng hồ tổng điểm.
  - List đáp án So khớp: Câu 1 - Trả lời: B - Đáp án: A (X Đỏ) -> Kèm Box Giải Thích (Explanation Context).
  - Nút Call to Action: "Làm lại bài Listening" hoặc "Bắt đầu thi R&W".

### 2.5. Trang Lịch sử thi (`/lich-su`)

- Danh sách các lượt thi đã hoàn thành, sắp xếp theo thời gian mới nhất.
- Mỗi item: Tên đề, kỹ năng (icon), điểm/điểm tối đa, thời gian thi.
- Click → xem chi tiết kết quả (reuse layout 2.4).
- Phân trang (10 items/page).

---

## 3. Các Trạng Thái Ngại Chờ (Loading States & Skeletons)

- Không dùng Spinner tròn quay quay cục bộ cho trang load câu hỏi vì mang lại cảm giác lag.
- Dùng **Skeleton Lines** nhấp nháy mô phỏng vị trí đoạn văn và các box MCQ.
- Hình ảnh / Audio phải check Pre-load ở component wrapper để tránh việc User bấm play nhưng audio chưa buffer xong báo lỗi.

---

## 4. Error States & Network Handling

Mọi trạng thái lỗi đều cần UI rõ ràng, không để user bối rối:

### 4.1. Auto-save States

| Trạng thái     | UI hiển thị                                                     | Hành động                                    |
| -------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Đang lưu       | Icon spinner nhỏ + "Đang lưu..." (text mờ)                      | —                                            |
| Lưu thành công | ✅ "Đã lưu lúc 10:25" (text xanh)                               | Tự ẩn sau 5s                                 |
| Lưu thất bại   | ⚠️ "Lưu thất bại — Thử lại" (text đỏ, clickable)                | Click → retry ngay. Auto retry sau 10s.      |
| Mất kết nối    | 🔴 Banner top: "Mất kết nối mạng. Đáp án đang được lưu cục bộ." | Tự retry khi có mạng lại (navigator.onLine). |

### 4.2. Session Expired

- Khi JWT hết hạn giữa chừng thi → hiển thị modal: "Phiên đăng nhập đã hết hạn. Đáp án của bạn đã được lưu. Vui lòng đăng nhập lại để tiếp tục."
- Nút: "Đăng nhập lại" (redirect `/login?redirect=/lam-bai/{attempt_id}`).

### 4.3. Exam Expired (Hết giờ)

- Đồng hồ về 00:00 → Modal full-screen: "Hết giờ! Bài thi đang được nộp tự động..."
- Loading spinner 2-3s (chờ server force submit).
- Redirect sang trang kết quả.

### 4.4. API Error (500, Network Error)

- Toast notification góc phải: "Đã xảy ra lỗi. Vui lòng thử lại."
- Nút "Thử lại" trong toast.
- Nếu lỗi liên tục (>3 lần) → hiển thị trang lỗi full với nút "Quay về trang chủ".

---

## 5. Accessibility (Khả năng tiếp cận)

Đảm bảo hệ thống có thể sử dụng được bởi mọi người, bao gồm người khuyết tật:

### 5.1. Keyboard Navigation

- Toàn bộ phòng thi phải navigate được bằng keyboard (Tab, Enter, Arrow keys).
- MCQ options: Arrow Up/Down để chọn, Enter để confirm.
- Bottom bar navigator: Tab focus vào từng ô câu hỏi, Enter để nhảy đến câu đó.
- Nút "Nộp bài" phải có focus visible rõ ràng.
- Trap focus trong modal (confirm submit, hết giờ) — không cho Tab ra ngoài.

### 5.2. ARIA Labels & Roles

```html
<!-- Ví dụ cho MCQ option -->
<div role="radiogroup" aria-labelledby="question-1-label">
  <label id="question-1-label">Câu 1: What time does the train leave?</label>
  <div role="radio" aria-checked="false" tabindex="0">A. 8:00</div>
  <div role="radio" aria-checked="true" tabindex="0">B. 9:00</div>
</div>

<!-- Đồng hồ đếm ngược -->
<div role="timer" aria-live="polite" aria-label="Thời gian còn lại">29:45</div>

<!-- Trạng thái auto-save -->
<div role="status" aria-live="polite">Đã lưu lúc 10:25</div>

<!-- Bottom bar navigator -->
<nav aria-label="Danh sách câu hỏi">
  <button aria-label="Câu 1 - Đã trả lời" aria-current="true">1</button>
  <button aria-label="Câu 2 - Chưa trả lời">2</button>
  <button aria-label="Câu 3 - Đã đánh dấu">3</button>
</nav>
```

### 5.3. Color Contrast & Visual

- Tất cả text phải đạt WCAG AA contrast ratio (≥ 4.5:1 cho text thường, ≥ 3:1 cho text lớn).
- Không dùng màu sắc là phương tiện duy nhất để truyền tải thông tin:
  - Đúng/Sai: Xanh/Đỏ + Icon ✅/❌ + Text "Đúng"/"Sai".
  - Trạng thái câu hỏi: Màu + Pattern/Icon (chưa làm = viền nét đứt, đã làm = filled, flagged = icon cờ).
- Đồng hồ đếm ngược: Ngoài đổi màu (Xanh→Cam→Đỏ), thêm icon cảnh báo ⚠️ khi <5 phút.

### 5.4. Screen Reader Support

- Audio player cho Listening phải có controls accessible (play/pause/seek bằng keyboard).
- Hình ảnh trong đề thi phải có `alt` text mô tả nội dung.
- Skeleton loading phải có `aria-busy="true"` và `aria-label="Đang tải nội dung"`.

### 5.5. Responsive & Touch

- Touch target tối thiểu 44x44px cho mobile (WCAG 2.5.5).
- MCQ options trên mobile phải đủ lớn để tap chính xác.
- Swipe gesture để chuyển câu hỏi (optional, có nút fallback).
