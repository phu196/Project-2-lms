const express = require('express')
const router = express.Router()
const multer = require("multer")
const upload = multer({ dest: "uploads/" }) // Thư mục lưu trữ tạm thời cho file tải lên

const controller = require("../../controllers/client/course.controller")
const assignmentController = require("../../controllers/client/assignment.controller")
const userMiddleware = require("../../middlewares/client/user.middleware")
// const courseMiddleware = require("../../middlewares/client/course.middleware")  

router.get('/', controller.index)

router.get("/create", userMiddleware.requireAuth, controller.create) // Chỉ cho phép đăng nhập (nên kiểm tra role ở controller)
router.post("/create", userMiddleware.requireAuth, controller.createPost)
// router.get("/search", controller.search); // Tìm kiếm khóa học

router.get("/:slug", controller.detail);
router.get("/:slug/edit", userMiddleware.requireAuth, controller.edit); // Chỉnh sửa khóa học (nên kiểm tra quyền truy cập trong controller)
router.post("/:slug/edit", userMiddleware.requireAuth, upload.single('thumbnail'), controller.editPost); // Cập nhật khóa học (nên kiểm tra quyền truy cập trong controller)

router.get('/:slug/manage', userMiddleware.requireAuth, controller.manage); // Thêm kiểm tra role trong controller.manage

router.post('/:slug/add-student', userMiddleware.requireAuth, controller.addStudent); // Thêm học viên
router.post("/:slug/add-lesson", userMiddleware.requireAuth, upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), controller.addLesson); // Thêm bài học (có thể cần kiểm tra quyền truy cập)

router.get("/:slug/course", controller.lessons); // Trang khóa học (có thể cần kiểm tra quyền truy cập)
router.get("/:slug/lessons/:lessonId", controller.lessonDetail); // Chi tiết bài học

router.post("/:slug/lessons/:lessonId/move-up", userMiddleware.requireAuth, controller.moveLessonUp);
router.post("/:slug/lessons/:lessonId/move-down", userMiddleware.requireAuth, controller.moveLessonDown);

router.get("/:slug/lessons/:lessonId/edit", userMiddleware.requireAuth, controller.editLesson); // Chỉnh sửa bài học
router.post("/:slug/lessons/:lessonId/edit", userMiddleware.requireAuth, upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), controller.editLessonPost); // Cập nhật bài học

router.get("/:slug/lessons/:lessonId/delete", userMiddleware.requireAuth, controller.deleteLesson); // Xóa bài học
router.post("/:slug/lessons/:lessonId/delete", userMiddleware.requireAuth, controller.deleteLessonPost); // Xóa bài học (xác nhận)

router.post('/:slug/lessons/:lessonId/comments', userMiddleware.requireAuth, controller.createComment);
router.get('/:slug/lessons/:lessonId/comments', userMiddleware.requireAuth, controller.listComments);

// // Assignment routes (nên đặt sau các route bài học)
router.get("/:slug/lessons/:lessonId/assignments", userMiddleware.requireAuth, assignmentController.listAssignments); // Danh sách assignment của lesson
router.get("/:slug/lessons/:lessonId/assignments/create", userMiddleware.requireAuth, assignmentController.createAssignment); // Trang tạo assignment
router.post("/:slug/lessons/:lessonId/assignments/create", userMiddleware.requireAuth, upload.any(), assignmentController.createAssignmentPost); // Tạo assignment

router.get("/:slug/lessons/:lessonId/assignments/:assignmentId", assignmentController.assignmentDetail); // Chi tiết assignment
router.post("/:slug/lessons/:lessonId/assignments/:assignmentId/move-up", userMiddleware.requireAuth, assignmentController.moveUp);
router.post("/:slug/lessons/:lessonId/assignments/:assignmentId/move-down", userMiddleware.requireAuth, assignmentController.moveDown);

router.get("/:slug/lessons/:lessonId/assignments/:assignmentId/edit", userMiddleware.requireAuth, assignmentController.editAssignment); // Trang chỉnh sửa assignment
router.post("/:slug/lessons/:lessonId/assignments/:assignmentId/edit", userMiddleware.requireAuth, upload.any(), assignmentController.editAssignmentPost); // Cập nhật assignment

router.get("/:slug/lessons/:lessonId/assignments/:assignmentId/delete", userMiddleware.requireAuth, assignmentController.deleteAssignment); // Xóa assignment

router.post("/:slug/lessons/:lessonId/assignments/:assignmentId/submit", userMiddleware.requireAuth, upload.any(), assignmentController.submitAssignmentPost); // Xử lý nộp bài

router.get("/:slug/lessons/:lessonId/assignments/:assignmentId/submissions", userMiddleware.requireAuth, assignmentController.listSubmissions); // Danh sách nộp bài của assignment
router.get("/:slug/lessons/:lessonId/assignments/:assignmentId/submissions/:submissionId", userMiddleware.requireAuth, assignmentController.submissionDetail); // Chi tiết nộp bài

module.exports = router