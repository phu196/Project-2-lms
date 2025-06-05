const Account = require("../../models/account.model");
const md5 = require("md5");

const systemConfig = require("../../config/systems");

module.exports.login = (req, res) => {
  res.render("admin/pages/auth/login", {
    pageTitle: "Đăng nhập",
    prefixAdmin: systemConfig.prefixAdmin
  });
}


module.exports.loginPost = async (req, res) => {
  const { email, password } = req.body;
  console.log("📩 Dữ liệu nhận được từ form:", { email, password });
  const allUsers = await Account.find({});
  console.log("📋 Danh sách tất cả tài khoản:", allUsers);

  const user = await Account.findOne({
    email: email,
    deleted: false
  });

  if (!user) {
    console.log("❌ Không tìm thấy user");
    return res.redirect("back");
  }

  const hashedPassword = md5(password);
  if (user.password !== hashedPassword) {
    console.log("❌ Mật khẩu không đúng");
    return res.redirect("back");
  }

  if (user.status !== "active") {
    console.log("❌ Tài khoản bị khóa");
    return res.redirect("back");
  }

  if (!user.token) {
    user.token = require("crypto").randomBytes(64).toString("hex");
    await user.save();
  }

  res.cookie("token", user.token);
  console.log("✅ Token đã set vào cookie:", user.token);

  res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
};

module.exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
}