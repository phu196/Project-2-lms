const User = require("../../models/user.model");
const md5 = require("md5");
const generateHelper = require("../../helpers/generate.helper");
const systemConfig = require("../../config/systems");

module.exports.index = async (req, res) => {
  const users = await User.find({ deleted: false });
  res.render("admin/pages/users/index", {
    pageTitle: "Danh sách người dùng",
    users: users
  });
};

module.exports.create = async (req, res) => {
  res.render("admin/pages/users/create", {
    pageTitle: "Tạo tài khoản người dùng"
  });
};

module.exports.createPost = async (req, res) => {
  req.body.password = md5(req.body.password);
  req.body.token = generateHelper.generateRandomString(30);

  const user = new User(req.body);
  await user.save();

  res.redirect(`${systemConfig.prefixAdmin}/users`);
};

module.exports.edit = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    deleted: false
  });

  res.render("admin/pages/users/edit", {
    pageTitle: "Chỉnh sửa tài khoản người dùng",
    user: user
  });
};

module.exports.editPatch = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    deleted: false
  });

  // Nếu chuyển sang giáo viên
  if (req.body.role === "teacher") {
    // Nếu user đã có teacherID thì giữ nguyên, nếu chưa có thì tạo mới
    if (!user.teacherID) {
      req.body.teacherID = "TEA" + Math.random().toString(36).substring(2, 8).toUpperCase();
    } else {
      req.body.teacherID = user.teacherID;
    }
  } else if (req.body.role === "student") {
    // Nếu chuyển sang học viên thì giữ nguyên teacherID (không cập nhật trường này)
    delete req.body.teacherID;
  }

  await User.updateOne({
    _id: req.params.id,
    deleted: false
  }, req.body);

  res.redirect("back");
};

module.exports.changePassword = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    deleted: false
  });

  res.render("admin/pages/users/change-password", {
    pageTitle: "Đổi mật khẩu",
    user: user
  });
};

module.exports.changePasswordPatch = async (req, res) => {
  await User.updateOne({
    _id: req.params.id,
    deleted: false
  }, {
    password: md5(req.body.password)
  });

  res.redirect(`${systemConfig.prefixAdmin}/users`);
};

module.exports.myProfile = async (req, res) => {
  res.render("admin/pages/users/my-profile", {
    pageTitle: "Thông tin cá nhân"
  });
};
