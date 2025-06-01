const User = require("../../models/user.model");
const Course = require("../../models/course.model");
const md5 = require("md5");

const generateHelper = require("../../helpers/generate.helper");

module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng ký tài khoản",
  });
};

module.exports.registerPost = async (req, res) => {
  const user = req.body;

  const existUser = await User.findOne({
    email: user.email,
    deleted: false
  });

  if(existUser) {
    // req.flash("error", "Email đã tồn tại trong hệ thống!");
    res.redirect("back");
    return;
  }

  const dataUser = {
    fullName: user.fullName,
    email: user.email,
    password: md5(user.password),
    token: generateHelper.generateRandomString(30),
    status: "active"
  };

  const newUser = new User(dataUser);
  await newUser.save();

  res.cookie("tokenUser", newUser.token);

  req.flash("success", "Đăng ký tài khoản thành công!");

  res.redirect("/");
};

module.exports.login = async (req, res) => {
  res.render("client/pages/user/login", {
    pageTitle: "Đăng nhập tài khoản",
  });
};

module.exports.loginPost = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const existUser = await User.findOne({
    email: email,
    deleted: false
  });

  if(!existUser) {
    req.flash("error", "Email không tồn tại trong hệ thống!");
    res.redirect("back");
    return;
  }

  if(md5(password) != existUser.password) {
    req.flash("error", "Sai mật khẩu!");
    res.redirect("back");
    return;
  }

  if(existUser.status != "active") {
    req.flash("error", "Tài khoản đang bị khóa!");
    res.redirect("back");
    return;
  }

  res.cookie("tokenUser", existUser.token);

  await User.updateOne({
    email: email
  }, {
    statusOnline: "online"
  });

  req.flash("success", "Đăng nhập thành công!");

  res.redirect("/");
};

module.exports.logout = async (req, res) => {
  await User.updateOne({
    token: req.cookies.tokenUser
  }, {
    statusOnline: "offline"
  });

  res.clearCookie("tokenUser");

  req.flash("success", "Đã đăng xuất!");

  res.redirect("/");
};

module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password;
  const tokenUser = req.cookies.tokenUser;

  await User.updateOne({
    token: tokenUser,
    status: "active",
    deleted: false
  }, {
    password: md5(password)
  });

  req.flash("success", "Đổi mật khẩu thành công!");

  res.redirect("/");
};

module.exports.profile = async (req, res) => {
  res.render("client/pages/user/profile", {
    pageTitle: "Thông tin tài khoản",
  });
};

module.exports.myCourses = async (req, res) => {
  if (!req.user) {
        req.flash("error", "Vui lòng đăng nhập để truy cập dashboard!");
        return res.redirect("/user/login");
    }

    let courses = [];
    if (req.user.role === 'teacher') {
        courses = await Course.find({ teachers: req.user._id, delete: false });
    } else if (req.user.role === 'student') {
        courses = await Course.find({ students: req.user._id, delete: false });
    }

    res.render("client/pages/user/my-courses", {
        pageTitle: "Bảng điều khiển",
        user: req.user,
        courses
    });
};