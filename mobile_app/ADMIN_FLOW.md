# TÀI LIỆU LUỒNG ADMIN MOBILE (ADMIN FLOW)

Chào mừng bạn đến với tài liệu hướng dẫn về luồng Admin trên ứng dụng di động. Tài liệu này giúp bạn hiểu nhanh cách hệ thống vận hành, cấu trúc mã nguồn và luồng dữ liệu chính của khu vực quản trị.

---

# 1. TỔNG QUAN

### 🟢 Project này làm gì?
Đây là một ứng dụng di động dành cho hệ thống quản lý thời trang (Fashion Shop Management). Nó cho phép người dùng mua sắm và quan trọng hơn, cho phép người quản trị (Admin) theo dõi mọi hoạt động của cửa hàng ngay trên điện thoại.

### 📱 Tại sao cần Mobile Admin?
Thay vì phải ngồi trước máy tính, Admin có thể:
- Kiểm tra doanh thu nhanh khi đang đi ngoài đường.
- Quản lý danh mục sản phẩm, đơn hàng mọi lúc mọi nơi.
- Theo dõi các tương tác của AI với khách hàng để điều chỉnh kịp thời.

### 🛠 Công nghệ sử dụng
- **Expo**: Framework phổ biến nhất để phát triển React Native, giúp tạo app nhanh và ổn định.
- **React Native**: Dùng ngôn ngữ Javascript nhưng chạy ra ứng dụng "nguyên bản" (Native) giúp hiệu năng mượt mà.
- **Expo Router**: Cách quản lý các trang (màn hình) theo cấu trúc thư mục, giống như cách làm của các trang web hiện đại (Next.js).

---

# 2. CẤU TRÚC THƯ MỤC QUAN TRỌNG

Để hiểu app Admin hoạt động ra sao, bạn cần để ý các folder này:

- **`app/admin/`**: Đây là "trái tim" của admin. Mỗi file ở đây tương ứng với một màn hình:
    - `dashboard.tsx`: Xem biểu đồ, tổng quan số liệu.
    - `products.tsx`: Quản lý danh sách quần áo, giày dép...
    - `orders.tsx`: Xem và xử lý các đơn hàng khách vừa đặt.
    - `categories.tsx`: Quản lý các phân loại mặt hàng.
    - `reports.tsx`: Các báo cáo chi tiết về doanh thu, tồn kho.
    - `ai-logs.tsx`: Xem lại nhật ký hành vi của chatbot AI.
- **`components/AdminSidebar.tsx`**: Thanh menu bên trái (Drawer). Khi bạn vuốt từ cạnh trái hoặc bấm icon menu, thanh này hiện ra để bạn chuyển giữa các trang quản lý.
- **`api/index.tsx`**: Đây là nơi chứa các "câu lệnh" để lấy dữ liệu từ server. Ví dụ: `productAPI.getAll()` sẽ lấy toàn bộ sản phẩm về.
- **`constants/Colors.ts`**: Nơi quy định màu sắc chung của app. Ví dụ màu chủ đạo (Primary) là màu tím đậm (`#1e1b6e`), tạo cảm giác chuyên nghiệp cho trang admin.

---

# 3. LUỒNG ĐĂNG NHẬP ADMIN (STEP-BY-STEP)

Đây là cách một người quản trị vào được hệ thống:

1.  **Mở ứng dụng**: App sẽ kiểm tra xem bạn đã đăng nhập chưa. Nếu chưa, nó sẽ đưa bạn tới màn hình **Login** (`app/auth/index.tsx`).
2.  **Nhập thông tin**: Admin nhập Email và Mật khẩu.
3.  **Xác thực**:
    - Khi bấm nút **SIGN IN**, app gọi API login gửi thông tin lên Backend.
    - **Backend** kiểm tra: "Đúng mật khẩu không? Tài khoản này có quyền Admin không?".
4.  **Nhận Token**: Nếu đúng, Backend trả về một đoạn mã (Token) và thông tin User. Token này được lưu vào điện thoại (qua `AsyncStorage`) để lần sau mở app không cần đăng nhập lại.
5.  **Điều hướng**: App kiểm tra thuộc tính `role` (vai trò). 
    - *Ví dụ*: Nếu `role === 'admin'`, app sẽ dùng lệnh `router.replace("/admin/dashboard")` để đưa Admin vào thẳng trang Dashboard.

---
*Tài liệu này được soạn thảo để giúp các lập trình viên mới nắm bắt nhanh project. Chúc bạn làm việc hiệu quả!*
