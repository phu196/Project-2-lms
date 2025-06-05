const mongoose = require("mongoose");
const dotenv = require("dotenv");
const md5 = require("md5");
const crypto = require("crypto");

const Account = require("../models/account.model");
const Role = require("../models/role.model");

dotenv.config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    // 1. Tạo role Admin nếu chưa có
    let adminRole = await Role.findOne({ title: "Admin", deleted: false });
    if (!adminRole) {
      adminRole = await Role.create({
        title: "Admin",
        description: "Quản trị hệ thống",
        permissions: ["*"],
      });
      console.log("✅ Đã tạo role 'Admin'");
    }

    // 2. Kiểm tra tài khoản admin
    const existing = await Account.findOne({ email: "admin@gmail.com" });
    if (existing) {
      console.log("⚠️ Tài khoản admin đã tồn tại.");
      return process.exit(0);
    }

    // 3. Hash password bằng md5 và tạo token
    const hashedPassword = md5("123456");
    const token = crypto.randomBytes(64).toString("hex");

    await Account.create({
      fullName: "Super Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      phone: "0123456789",
      avatar: "",
      role_id: adminRole._id.toString(),
      status: "active",
      token: token,
    });

    console.log("✅ Tạo tài khoản admin thành công!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  }
}

seedAdmin();
