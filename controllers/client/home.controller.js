const User = require("../../models/user.model");
const Course = require("../../models/course.model");
const md5 = require("md5");
const generateHelper = require("../../helpers/generate.helper");

// [GET] /
module.exports.index = (req, res) => {
    res.render("client/pages/home/index", {
        pageTitle: "Trang chủ"
    })
}

// [GET] /dashboard
module.exports.dashboard = async (req, res) => {
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

    res.render("client/pages/home/dashboard", {
        pageTitle: "Bảng điều khiển",
        user: req.user,
        courses
    });
}