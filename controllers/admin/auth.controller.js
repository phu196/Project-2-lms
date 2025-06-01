const Account = require("../../models/account.model");
const md5 = require("md5");

const systemConfig = require("../../config/systems");

module.exports.login = (req, res) => {
  res.render("admin/pages/auth/login", {
    pageTitle: "Đăng nhập"
  });
}

module.exports.loginPost = async (req, res) => {
  const { email, password } = req.body;

  const user = await Account.findOne({
    email: email,
    deleted: false
  });

  if(!user) {
    res.send("Tài khoản không tồn tại!");
    res.redirect("back");
    return;
  }

  if(md5(password) != user.password) {
    res.send("Mật khẩu không đúng!");
    res.redirect("back");
    return;
  }

  if(user.status != "active") {
    res.send("Tài khoản của bạn đã bị khóa!");
    res.redirect("back");
    return;
  }

  res.cookie("token", user.token);
  res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
}

module.exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
}