# 📚 LMS Management - Hệ thống quản lý học trực tuyến

Đây là một dự án web đơn giản mô phỏng hệ thống quản lý học trực tuyến, được xây dựng bằng **Node.js**, **Express**, **MongoDB** và template engine **Pug**.

## 🚀 Tính năng chính

- ✅ Đăng nhập / Đăng xuất với phân quyền
- 📂 Quản lý tài khoản người dùng
- 🧑‍🏫 Quản lý vai trò (Role)
- 🛡️ Middleware xác thực (Auth Middleware)
- 🛠 Cấu trúc MVC rõ ràng, dễ mở rộng

---

## 🧰 Công nghệ sử dụng

| Công nghệ       | Mô tả                          |
|----------------|---------------------------------|
| Node.js        | Nền tảng JavaScript backend     |
| Express.js     | Framework server nhẹ            |
| MongoDB        | Cơ sở dữ liệu NoSQL             |
| Mongoose       | ORM cho MongoDB                 |
| Pug            | Template engine render giao diện|
| dotenv         | Quản lý biến môi trường         |
| md5            | Mã hóa mật khẩu                 |
| cookie-parser  | Đọc cookie                      |

---

## 📦 Cài đặt & Chạy thử

1. Clone dự án
git clone https://github.com/phu196/Project-2-lms
cd lms-management
2. Cài đặt dependencies
npm install
3. Tạo file .env
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/lms_management

4. Seed tài khoản admin
node scripts/seedAdmin.js
Kết quả trên terminal:
✅ Tạo tài khoản admin thành công!
5. Chạy ứng dụng
npm start
Truy cập: http://localhost:3000/admin/auth/login

Email: admin@gmail.com
Password: 123456
