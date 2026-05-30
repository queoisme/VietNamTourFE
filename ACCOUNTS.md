# 🔐 Tài Khoản Demo - VietnamTours

## 📋 Danh Sách Tài Khoản

### 1. 👨‍🏫 Hướng Dẫn Viên Đã Xác Minh (CÓ TOUR SẴN)

**Thông tin đăng nhập:**
- **Email:** `nguyen.minh.tuan@gmail.com`
- **Mật khẩu:** `123456`

**Thông tin tài khoản:**
- Tên: Nguyễn Minh Tuấn
- Role: Guide (Hướng dẫn viên)
- Trạng thái: ✅ Đã xác minh
- Kinh nghiệm: 8 năm
- Rating: 4.9/5 (127 đánh giá)
- Chứng chỉ: 
  - Chứng chỉ HDV Quốc gia
  - Chứng chỉ Cứu hộ khẩn cấp
  - Chứng chỉ Lái xuồng kayak

**Tour đã tạo:**
1. **Trekking Sapa - Chinh Phục Fansipan**
   - Giá: 2.500.000 VNĐ
   - Thời gian: 3 ngày 2 đêm
   - Độ khó: Challenging
   - Địa điểm: Lào Cai

2. **Hội An - Trải Nghiệm Văn Hóa & Làng Nghề**
   - Giá: 800.000 VNĐ
   - Thời gian: 1 ngày
   - Độ khó: Easy
   - Địa điểm: Quảng Nam

3. **Phú Quốc - Lặn Biển & Khám Phá Đảo Ngọc**
   - Giá: 3.200.000 VNĐ
   - Thời gian: 3 ngày 2 đêm
   - Độ khó: Easy
   - Địa điểm: Kiên Giang

---

### 2. 👨‍🏫 Hướng Dẫn Viên Demo (Chưa có tour)

**Thông tin đăng nhập:**
- **Email:** `guide@demo.com`
- **Mật khẩu:** `123456`

**Thông tin tài khoản:**
- Tên: Nguyễn Văn Hướng
- Role: Guide (Hướng dẫn viên)
- Trạng thái: ✅ Đã xác minh
- Kinh nghiệm: 5 năm
- Tour đã tạo: 0 (có thể tạo tour mới)

---

### 3. 👤 Khách Du Lịch

**Thông tin đăng nhập:**
- **Email:** `customer@demo.com`
- **Mật khẩu:** `123456`

**Thông tin tài khoản:**
- Tên: Trần Thị Khách
- Role: Customer (Khách hàng)
- Lịch sử đặt tour: Đã được xóa clean
- Có thể đặt tour và viết review

---

### 4. 🛡️ Admin Hệ Thống

**Thông tin đăng nhập:**
- **Email:** `admin@demo.com`
- **Mật khẩu:** `admin123`

**Thông tin tài khoản:**
- Tên: Admin Hệ Thống
- Role: Admin
- Quyền: Quản lý toàn bộ hệ thống

**Trang admin:**
- `/admin/login` - Đăng nhập admin
- `/admin/dashboard` - Dashboard tổng quan
- `/admin/users` - Quản lý người dùng
- `/admin/tours` - Quản lý tour
- `/admin/applications` - Duyệt hồ sơ HDV
- `/admin/reports` - Báo cáo & thống kê

---

## 🚀 Cách Sử Dụng

### Đăng nhập với tài khoản Guide có tour:

1. Truy cập trang đăng nhập: `/login`
2. Nhập:
   - Email: `nguyen.minh.tuan@gmail.com`
   - Password: `123456`
3. Sau khi đăng nhập, bạn sẽ được chuyển đến `/guide` (Guide Dashboard)
4. Tại đây bạn sẽ thấy:
   - ✅ 3 tour đã tạo sẵn
   - ✅ Thống kê về tour và bookings
   - ✅ Có thể tạo tour mới
   - ✅ Quản lý bookings từ khách hàng

### Tạo tour mới:

1. Đăng nhập với tài khoản guide
2. Click "Tạo tour mới" tại Dashboard
3. Điền thông tin tour và submit
4. Tour sẽ hiển thị trên trang chủ

---

## 📝 Lưu Ý

- Tất cả dữ liệu được lưu trong `localStorage`
- Dữ liệu sẽ được reset khi xóa localStorage
- Mật khẩu demo đều đơn giản để test (123456 hoặc admin123)
- Tài khoản `nguyen.minh.tuan@gmail.com` là tài khoản guide hoàn chỉnh nhất với 3 tour đã tạo sẵn
- **Nếu bạn thấy menu vẫn hiển thị "Đăng ký HDV" cho guide đã xác minh:**
  1. Mở DevTools Console (F12)
  2. Chạy: `localStorage.removeItem('guideApplications')`
  3. Refresh trang (F5)
  4. Menu sẽ tự động ẩn "Đăng ký HDV" cho guide đã approved