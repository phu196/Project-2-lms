const Course = require("../../models/course.model")
const User = require("../../models/user.model")
const Lesson = require("../../models/lesson.model")
const Assignment = require("../../models/assignment.model");
const Question = require("../../models/question.model");
const Comment = require("../../models/comment.model");
const mongoose = require("mongoose");

// [GET] /courses
module.exports.index = async (req, res) => {
    const courses = await Course.find({
        status: "active",
        delete: false
    })

    const newCourses = courses.map(item => {
        item.priceNew = (item.price * (100 - item.discountPercentage) / 100).toFixed(2);
        return item
    })

    res.render("client/pages/courses/index", {
        pageTitle: "Danh sách khóa học",
        courses: newCourses
    })
}

// [GET] /courses/create
module.exports.create = async (req, res) => {
    // Chỉ cho phép giảng viên tạo khóa học
    if (!req.user || req.user.role !== "teacher") {
        req.flash("error", "Chỉ giảng viên mới được tạo khóa học!");
        return res.redirect("/courses");
    }
    res.render("client/pages/courses/create", {
        pageTitle: "Tạo khóa học mới"
    });
}

// [POST] /courses/create
module.exports.createPost = async (req, res) => {
    if (!req.user || req.user.role !== "teacher") {
        req.flash("error", "Chỉ giảng viên mới được tạo khóa học!");
        return res.redirect("/courses");
    }
    try {
        const data = req.body;
        // Đa giáo viên: thêm vào mảng teachers và teacherIDs
        data.teachers = [req.user._id];
        data.teacherIDs = [req.user.teacherID];
        data.teacherNames = [req.user.fullName];
        data.teacherEmails = [req.user.email];
        data.status = "active";
        data.delete = false;
        // Thêm các trường khác nếu cần (thumbnail, price, v.v.)

        const course = new Course(data);
        await course.save();

        req.flash("success", "Tạo khóa học thành công!");
        res.redirect("/courses");
    } catch (error) {
        req.flash("error", "Có lỗi xảy ra khi tạo khóa học!");
        res.redirect("/courses/create");
    }
}

// [GET] /courses/:slug/edit
module.exports.edit = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    // Chỉ cho phép giảng viên quản lý khóa học được sửa
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền chỉnh sửa khóa học này!");
        return res.redirect("/courses");
    }
    res.render("client/pages/courses/edit", {
        pageTitle: `Chỉnh sửa khóa học: ${course.title}`,
        course
    });
};

// [POST] /courses/:slug/edit
module.exports.editPost = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    // Chỉ cho phép giảng viên quản lý khóa học được sửa
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền chỉnh sửa khóa học này!");
        return res.redirect("/courses");
    }

    const { title, description, thumbnailUrl } = req.body;
    // Xử lý thumbnail: ưu tiên file, nếu không có thì lấy link, nếu cả hai đều không có thì giữ nguyên
    let thumbnail = course.thumbnail;
    if (req.file && req.file.filename) {
        thumbnail = '/uploads/' + req.file.filename;
    } else if (thumbnailUrl && thumbnailUrl.trim() !== "") {
        thumbnail = thumbnailUrl.trim();
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.thumbnail = thumbnail;

    await course.save();

    req.flash("success", "Cập nhật khóa học thành công!");
    res.redirect(`/courses/${course.slug}/edit`);
};

module.exports.detail = async (req, res) => {
    try {
        const find = {
            delete: false,
            slug: req.params.slug
        }

        const course = await Course.findOne(find)

        res.render("client/pages/courses/detail", {
            pageTitle: course.title,
            course: course
        })
    } catch (error) {
        res.redirect(`/courses`)
    }
}

module.exports.manage = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false })
        .populate('students')
        .lean(); // nên dùng lean để làm nhẹ object và dễ thao tác

    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }

    // Lấy các bài học không bị xóa mềm
    const lessons = await Lesson.find({ courseId: course._id, delete: false }).sort({ order: 1 }).lean();

    res.render("client/pages/courses/manage", {
        pageTitle: "Quản lý khóa học",
        course,
        lessons
    });
};

// [POST] /courses/:slug/add-student
module.exports.addStudent = async (req, res) => {
    const { email } = req.body;
    const course = await Course.findOne({ slug: req.params.slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("back");
    }
    // Kiểm tra quyền quản lý (giảng viên)
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền quản lý khóa học này!");
        return res.redirect("back");
    }
    // Tìm học viên theo email
    const student = await User.findOne({ email, role: "student", deleted: false });
    if (!student) {
        req.flash("error", "Không tìm thấy học viên với email này!");
        return res.redirect("back");
    }
    // Kiểm tra đã có trong danh sách chưa
    if (course.students.includes(student._id)) {
        req.flash("error", "Học viên đã có trong khóa học!");
        return res.redirect("back");
    }
    // Thêm học viên vào khóa học
    course.students.push(student._id);
    await course.save();

    req.flash("success", "Thêm học viên thành công!");
    res.redirect("back");
};

// [POST] /courses/:slug/add-lesson
module.exports.addLesson = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("back");
    }
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền quản lý khóa học này!");
        return res.redirect("back");
    }
    const { title, content, description, pdfUrl: pdfUrlInput, videoUrl: videoUrlInput } = req.body;
    if (!title || !content) {
        req.flash("error", "Vui lòng nhập đầy đủ tiêu đề và nội dung bài học!");
        return res.redirect("back");
    }

    // Xử lý file upload hoặc link
    let pdfUrl = null, videoUrl = null, videoType = 'local';
    if (req.files && req.files['pdf']) {
        pdfUrl = '/uploads/' + req.files['pdf'][0].filename;
    } else if (pdfUrlInput) {
        pdfUrl = pdfUrlInput;
    }
    if (req.files && req.files['video']) {
        videoUrl = '/uploads/' + req.files['video'][0].filename;
        videoType = 'local';
    } else if (videoUrlInput) {
        videoUrl = videoUrlInput;
        if (/youtube\.com|youtu\.be/.test(videoUrlInput)) {
            videoType = 'youtube';
        } else if (/vimeo\.com/.test(videoUrlInput)) {
            videoType = 'vimeo';
        } else {
            videoType = 'local';
        }
    }

    const lesson = new Lesson({ title, content, description, pdfUrl, videoUrl, videoType, courseId: course._id });
    await lesson.save();

    course.lessons.push(lesson._id);
    await course.save();

    req.flash("success", "Thêm bài học thành công!");
    res.redirect("back");
};
// Di chuyển bài học lên
module.exports.moveLessonUp = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false }).populate('lessons');
    if (!course) return res.redirect("back");
    const idx = course.lessons.findIndex(l => l._id.toString() === req.params.lessonId);
    if (idx > 0) {
        // Đổi vị trí trong mảng
        [course.lessons[idx - 1], course.lessons[idx]] = [course.lessons[idx], course.lessons[idx - 1]];
        course.markModified('lessons');
        await course.save();
    }
    res.redirect(`/courses/${course.slug}/manage`);
};

// Di chuyển bài học xuống
module.exports.moveLessonDown = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false }).populate('lessons');
    if (!course) return res.redirect("back");
    const idx = course.lessons.findIndex(l => l._id.toString() === req.params.lessonId);
    if (idx < course.lessons.length - 1) {
        [course.lessons[idx], course.lessons[idx + 1]] = [course.lessons[idx + 1], course.lessons[idx]];
        course.markModified('lessons');
        await course.save();
    }
    res.redirect(`/courses/${course.slug}/manage`);
};
// [GET] /courses/:slug/course
module.exports.lessons = async (req, res) => {
    // Tìm khóa học theo slug
    const course = await Course.findOne({ slug: req.params.slug, delete: false })
        .populate('lessons');
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }

    // Kiểm tra quyền truy cập: chỉ học viên đã được add hoặc giáo viên quản lý mới được xem
    const isTeacher = req.user && req.user.role === "teacher" && course.teachers.includes(req.user._id);
    const isStudent = req.user && req.user.role === "student" && course.students.includes(req.user._id);

    if (!isTeacher && !isStudent) {
        req.flash("error", "Bạn không có quyền truy cập khóa học này!");
        return res.redirect("/courses");
    }

    res.render("client/pages/courses/lessons", {
        pageTitle: `Khóa học: ${course.title}`,
        course
    });
};

// [GET] /courses/:slug/lessons/:lessonId
module.exports.lessonDetail = async (req, res) => {
    // Tìm khóa học và populate lessons
    const course = await Course.findOne({ slug: req.params.slug, delete: false })
        .populate({
            path: 'lessons',
            populate: { path: 'assignments' }
        });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }

    // Tìm bài học trong danh sách lessons của khóa học
    const lesson = course.lessons.find(
        l => l._id.toString() === req.params.lessonId
    );
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${course.slug}/course`);
    }

    // Lấy danh sách assignment chưa bị xóa mềm
    const assignments = lesson.assignments?.filter(a => !a.delete) || [];

    // Kiểm tra quyền truy cập: chỉ học viên đã được add hoặc giáo viên quản lý mới được xem
    const isTeacher = req.user && req.user.role === "teacher" && course.teachers.includes(req.user._id);
    const isStudent = req.user && req.user.role === "student" && course.students.includes(req.user._id);

    if (!isTeacher && !isStudent) {
        req.flash("error", "Bạn không có quyền truy cập bài học này!");
        return res.redirect("/courses");
    }
    const comments = await Comment.find({ lessonId: lesson._id })
        .populate('userId')
        .sort({ createdAt: -1 });
    res.render("client/pages/courses/lesson-detail", {
        pageTitle: lesson.title,
        course,
        lesson,
        assignments,
        isTeacher,
        comments: comments || []
    });
};

// [GET] /courses/:slug/lessons/:lessonId/edit
module.exports.editLesson = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false })
        .populate('lessons');
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }

    // Kiểm tra quyền quản lý (giảng viên)
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền quản lý khóa học này!");
        return res.redirect("/courses");
    }

    const lessons = await Lesson.find({ courseId: { $exists: false } });
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${course.slug}/course`);
    }

    res.render("client/pages/courses/edit-lesson", {
        pageTitle: `Chỉnh sửa bài học: ${lesson.title}`,
        course,
        lesson
    });
};

// [POST] /courses/:slug/lessons/:lessonId/edit
module.exports.editLessonPost = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false }).populate('lessons');
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền quản lý khóa học này!");
        return res.redirect("/courses");
    }
    const lesson = course.lessons.find(l => l._id.toString() === req.params.lessonId);
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${course.slug}/course`);
    }
    const { title, content, description, pdfUrl: pdfUrlInput, videoUrl: videoUrlInput } = req.body;
    if (!title || !content) {
        req.flash("error", "Vui lòng nhập đầy đủ tiêu đề và nội dung bài học!");
        return res.redirect("back");
    }
    // Xử lý file upload hoặc link
    let pdfUrl = lesson.pdfUrl, videoUrl = lesson.videoUrl, videoType = lesson.videoType;
    // PDF: ưu tiên file, nếu không có thì lấy link, nếu cả hai đều không có thì giữ nguyên
    if (req.files && req.files['pdf'] && req.files['pdf'][0]) {
        pdfUrl = '/uploads/' + req.files['pdf'][0].filename;
    } else if (pdfUrlInput && pdfUrlInput.trim() !== "") {
        pdfUrl = pdfUrlInput;
    }
    // Video: ưu tiên file, nếu không có thì lấy link, nếu cả hai đều không có thì giữ nguyên
    if (req.files && req.files['video'] && req.files['video'][0]) {
        videoUrl = '/uploads/' + req.files['video'][0].filename;
        videoType = 'local';
    } else if (videoUrlInput && videoUrlInput.trim() !== "") {
        videoUrl = videoUrlInput;
        if (/youtube\.com|youtu\.be/.test(videoUrlInput)) {
            videoType = 'youtube';
        } else if (/vimeo\.com/.test(videoUrlInput)) {
            videoType = 'vimeo';
        } else {
            videoType = 'local';
        }
    }
    // Cập nhật thông tin bài học
    lesson.title = title;
    lesson.content = content;
    lesson.description = description || "";
    lesson.pdfUrl = pdfUrl;
    lesson.videoUrl = videoUrl;
    lesson.videoType = videoType;
    await lesson.save();
    req.flash("success", "Cập nhật bài học thành công!");
    res.redirect(`/courses/${course.slug}/lessons/${lesson._id}`);
};

// [GET] /courses/:slug/lessons/:lessonId/delete
module.exports.deleteLesson = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false }).populate('lessons');
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    // Kiểm tra quyền quản lý (giảng viên)
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền quản lý khóa học này!");
        return res.redirect("/courses");
    }
    const lesson = course.lessons.find(l => l._id.toString() === req.params.lessonId);
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${course.slug}/manage`);
    }
    // Đánh dấu trạng thái delete = true thay vì xóa hoàn toàn
    await Lesson.findByIdAndUpdate(req.params.lessonId, { delete: true, deleteAt: new Date() });

    // Xóa lesson khỏi mảng lessons của course (nếu muốn ẩn khỏi giao diện)
    course.lessons = course.lessons.filter(l => l._id.toString() !== req.params.lessonId);
    await course.save();

    req.flash("success", "Xóa bài học thành công!");
    res.redirect(`/courses/${course.slug}/manage`);
};

// [POST] /courses/:slug/lessons/:lessonId/delete
module.exports.deleteLessonPost = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false }).populate('lessons');
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    // Kiểm tra quyền quản lý (giảng viên)
    if (!req.user || req.user.role !== "teacher" || !course.teachers.includes(req.user._id)) {
        req.flash("error", "Bạn không có quyền quản lý khóa học này!");
        return res.redirect("/courses");
    }
    const lesson = course.lessons.find(l => l._id.toString() === req.params.lessonId);
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${course.slug}/manage`);
    }
    // Đánh dấu trạng thái delete = true thay vì xóa hoàn toàn
    await Lesson.findByIdAndUpdate(req.params.lessonId, { delete: true, deleteAt: new Date() });

    // Xóa lesson khỏi mảng lessons của course (nếu muốn ẩn khỏi giao diện)
    course.lessons = course.lessons.filter(l => l._id.toString() !== req.params.lessonId);
    await course.save();

    req.flash("success", "Xóa bài học thành công!");
    res.redirect(`/courses/${course.slug}/manage`);
};

module.exports.createComment = async (req, res) => {
    const { lessonId, slug } = req.params;
    const { content } = req.body;

    // Lấy courseId từ lesson
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        req.flash('error', 'Không tìm thấy bài học!');
        return res.redirect('back');
    }
    if (!lesson.courseId) {
        req.flash('error', 'Bài học này chưa có trường courseId. Vui lòng liên hệ quản trị viên để cập nhật dữ liệu.');
        return res.redirect('back');
    }

    await Comment.create({
        lessonId,
        courseId: lesson.courseId,
        userId: req.user._id,
        content: content.trim()
    });
    console.log('Current User:', req.user);
    res.redirect('back');
};

module.exports.listComments = async (req, res) => {
    const { lessonId } = req.params;
    const comments = await Comment.find({ lessonId })
        .populate('userId')
        .sort({ createdAt: -1 });
    res.json(comments);
};