const Course = require("../../models/course.model")
const User = require("../../models/user.model")
const Lesson = require("../../models/lesson.model")
const Assignment = require("../../models/assignment.model");
const Question = require("../../models/question.model");
const Submission = require("../../models/submission.model");
const mongoose = require("mongoose");

const { parseOptions } = require("../../helpers/questionParser");

// [GET] /courses/:slug/lessons/:lessonId/assignments
module.exports.listAssignments = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false })
        .populate({
            path: 'lessons',
            populate: { path: 'assignments' }
        });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    const lesson = course.lessons.find(l => l._id.toString() === req.params.lessonId);
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${course.slug}/course`);
    }
    // Lấy danh sách assignment và đồng bộ lại order nếu thiếu
    let assignments = await Assignment.find({ lessonId: lesson._id, delete: { $ne: true } }).sort({ order: 1, createdAt: 1 });
    let needUpdate = false;
    for (let i = 0; i < assignments.length; i++) {
        if (typeof assignments[i].order !== 'number') {
            assignments[i].order = i + 1;
            await assignments[i].save();
            needUpdate = true;
        }
    }
    // Nếu vừa cập nhật order, lấy lại danh sách đã sort đúng
    if (needUpdate) {
        assignments = await Assignment.find({ lessonId: lesson._id, delete: { $ne: true } }).sort({ order: 1, createdAt: 1 });
    }
    res.render("client/pages/assignments/index", {
        pageTitle: `Danh sách bài tập - ${lesson.title}`,
        course,
        lesson,
        assignments
    });
};
// Đổi thứ tự lên
module.exports.moveUp = async (req, res) => {
    const { lessonId, assignmentId, slug } = req.params;
    try {
        // Lấy tất cả assignment theo lesson, sort đúng thứ tự
        const assignments = await Assignment.find({ lessonId, delete: { $ne: true } }).sort({ order: 1, createdAt: 1 });
        // Nếu chưa có trường order, đồng bộ lại
        for (let i = 0; i < assignments.length; i++) {
            if (typeof assignments[i].order !== 'number') {
                assignments[i].order = i + 1;
                await assignments[i].save();
            }
        }
        const idx = assignments.findIndex(a => a._id.toString() === assignmentId);
        if (idx > 0) {
            // Hoán đổi order với assignment phía trên
            const current = assignments[idx];
            const prev = assignments[idx - 1];
            const tempOrder = current.order;
            current.order = prev.order;
            prev.order = tempOrder;
            await current.save();
            await prev.save();
        }
        res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
    } catch (err) {
        console.error("Lỗi moveUp assignment:", err);
        req.flash("error", "Không thể thay đổi thứ tự!");
        res.redirect("back");
    }
};

// Đổi thứ tự xuống
module.exports.moveDown = async (req, res) => {
    const { lessonId, assignmentId, slug } = req.params;
    try {
        // Lấy tất cả assignment theo lesson, sort đúng thứ tự
        const assignments = await Assignment.find({ lessonId, delete: { $ne: true } }).sort({ order: 1, createdAt: 1 });
        // Nếu chưa có trường order, đồng bộ lại
        for (let i = 0; i < assignments.length; i++) {
            if (typeof assignments[i].order !== 'number') {
                assignments[i].order = i + 1;
                await assignments[i].save();
            }
        }
        const idx = assignments.findIndex(a => a._id.toString() === assignmentId);
        if (idx < assignments.length - 1 && idx !== -1) {
            // Hoán đổi order với assignment phía dưới
            const current = assignments[idx];
            const next = assignments[idx + 1];
            const tempOrder = current.order;
            current.order = next.order;
            next.order = tempOrder;
            await current.save();
            await next.save();
        }
        res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
    } catch (err) {
        console.error("Lỗi moveDown assignment:", err);
        req.flash("error", "Không thể thay đổi thứ tự!");
        res.redirect("back");
    }
};
// [GET] /courses/:slug/lessons/:lessonId/assignments/create
module.exports.createAssignment = async (req, res) => {
    const course = await Course.findOne({ slug: req.params.slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    const lessonId = req.params.lessonId;
    res.render("client/pages/assignments/create", {
        pageTitle: "Tạo bài tập mới",
        course,
        lessonId: req.params.lessonId,
        slug: req.params.slug,
        success: req.flash("success"),
        error: req.flash("error")
    });

};

module.exports.createAssignmentPost = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug, delete: false });
        if (!course) {
            req.flash("error", "Không tìm thấy khóa học!");
            return res.redirect("/courses");
        }

        const lesson = await Lesson.findById(req.params.lessonId);
        if (!lesson) {
            req.flash("error", "Không tìm thấy bài học!");
            return res.redirect(`/courses/${course.slug}/course`);
        }

        const { title, description } = req.body;
        if (!title) {
            console.log("REQ BODY:", req.body);
            req.flash("error", "Vui lòng nhập tiêu đề bài tập!");
            return res.redirect("back");
        }

        // Lấy order lớn nhất hiện tại
        const maxOrderAssignment = await Assignment.findOne({ lessonId: lesson._id, delete: { $ne: true } }).sort({ order: -1 });
        const nextOrder = maxOrderAssignment && typeof maxOrderAssignment.order === 'number' ? maxOrderAssignment.order + 1 : 1;

        // Tạo bài tập mới
        const assignment = new Assignment({
            title,
            description,
            courseId: course._id,
            lessonId: lesson._id,
            dueDate: req.body.dueDate || null,
            order: nextOrder // <-- thêm dòng này
        });

        await assignment.save();

        // Thêm assignment vào lesson
        lesson.assignments = lesson.assignments || [];
        lesson.assignments.push(assignment._id);
        await lesson.save();

        // Xử lý danh sách câu hỏi
        const questionsData = req.body.questions || [];
        const questionDocs = [];
        assignment.question = questionDocs;
        for (const q of questionsData) {
            if (!q.content || !q.correctAnswer || !q.type) continue;

            // Chuyển định dạng kiểu câu hỏi nếu cần
            const formattedType = q.type.replace(/_/g, '-');


            // Parse options thành mảng đối tượng: { optionText, isCorrect }
            const options = (formattedType === 'single-choice' || formattedType === 'multiple-choice')
                ? parseOptions(q.options, q.correctAnswer)
                : [];

            // Xử lý đáp án đúng cho fill_in_blank
            let correctAnswer = q.correctAnswer;
            if (formattedType === 'multiple-choice') {
                if (typeof correctAnswer === 'string') {
                    correctAnswer = correctAnswer
                        .split(',')
                        .map(ans => ans.trim())
                        .filter(ans => ans !== ''); // loại phần tử rỗng
                } else if (Array.isArray(correctAnswer)) {
                    correctAnswer = correctAnswer
                        .map(ans => ans.trim())
                        .filter(ans => ans !== ''); // ✅ thêm dòng này để loại bỏ `""`
                }
            }
            else if (formattedType === 'fill-in-blank') {
                if (typeof correctAnswer === 'string' && correctAnswer.includes(',')) {
                    correctAnswer = correctAnswer.split(',').map(ans => ans.trim());
                } else if (typeof correctAnswer === 'string') {
                    correctAnswer = correctAnswer.trim();
                }
            }
            const question = new Question({
                assignmentId: assignment._id,
                questiontext: q.content.trim(),
                type: formattedType,
                options,
                correctAnswer: correctAnswer,
                points: q.points || 1
            });
            console.log("OPTIONS:", options);
            await question.save();
            questionDocs.push(question._id);
        }

        // Gán danh sách câu hỏi cho assignment
        assignment.question = questionDocs;
        await assignment.save();

        req.flash("success", "Tạo bài tập thành công!");
        return res.redirect(`/courses/${course.slug}/lessons/${lesson._id}`);

    } catch (err) {
        console.error("Assignment creation error:", err);
        req.flash("error", "Có lỗi xảy ra khi tạo bài tập.");
        return res.redirect("back");
    }
};


// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId
module.exports.assignmentDetail = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        req.flash("error", "ID không hợp lệ!");
        return res.redirect("/courses");
    }
    const course = await Course.findOne({ slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${slug}/course`);
    }
    const assignment = await Assignment.findById(assignmentId).populate('question');
    if (!assignment || assignment.delete) {
        req.flash("error", "Không tìm thấy bài tập!");
        return res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
    }
    const questions = assignment.question || [];
    res.render("client/pages/assignments/detail", {
        pageTitle: `Chi tiết bài tập - ${assignment.title}`,
        course,
        lesson,
        assignment,
        questions,
        isTeacher: req.user && req.user.role === "teacher"
    });
};

// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/edit
module.exports.editAssignment = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        req.flash("error", "ID không hợp lệ!");
        return res.redirect("/courses");
    }
    const course = await Course.findOne({ slug, delete: false });
    if (!course) {
        req.flash("error", "Không tìm thấy khóa học!");
        return res.redirect("/courses");
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        req.flash("error", "Không tìm thấy bài học!");
        return res.redirect(`/courses/${slug}/course`);
    }
    const assignment = await Assignment.findById(assignmentId).populate('question');
    if (!assignment || assignment.delete) {
        req.flash("error", "Không tìm thấy bài tập!");
        return res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
    }
    const questions = assignment.question || [];
    res.render("client/pages/assignments/edit", {
        pageTitle: `Sửa bài tập - ${assignment.title}`,
        course,
        lesson,
        assignment,
        questions
    });
};

// [POST] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/edit
module.exports.editAssignmentPost = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        req.flash("error", "ID không hợp lệ!");
        return res.redirect("/courses");
    }
    const assignment = await Assignment.findById(assignmentId).populate('question');
    if (!assignment || assignment.delete) {
        req.flash("error", "Không tìm thấy bài tập!");
        return res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
    }

    // Cập nhật thông tin assignment
    const { title, description } = req.body;
    assignment.title = title;
    assignment.description = description;

    // Xử lý cập nhật và thêm câu hỏi
    const questionsData = req.body.questions || [];
    for (const q of questionsData) {
        // Nếu có _id => sửa câu hỏi cũ
        if (q._id) {
            const question = await Question.findById(q._id);
            if (question) {
                question.questiontext = q.content.trim();
                question.type = q.type.replace('_', '-');
                // Xử lý options và đáp án đúng
                question.options = parseOptions(q.options, q.correctAnswer);
                let correctAnswer = q.correctAnswer;
                if (question.type === 'fill-in-blank') {
                    if (typeof correctAnswer === 'string' && correctAnswer.includes(',')) {
                        correctAnswer = correctAnswer.split(',').map(ans => ans.trim());
                    } else if (typeof correctAnswer === 'string') {
                        correctAnswer = correctAnswer.trim();
                    }
                }
                question.correctAnswer = correctAnswer;
                await question.save();
            }
        } else {
            // Nếu không có _id => thêm câu hỏi mới
            let correctAnswer = q.correctAnswer;
            const formattedType = q.type.replace('_', '-');
            if (formattedType === 'fill-in-blank') {
                if (typeof correctAnswer === 'string' && correctAnswer.includes(',')) {
                    correctAnswer = correctAnswer.split(',').map(ans => ans.trim());
                } else if (typeof correctAnswer === 'string') {
                    correctAnswer = correctAnswer.trim();
                }
            }
            const options = parseOptions(q.options, q.correctAnswer);
            const newQuestion = new Question({
                assignmentId: assignment._id,
                questiontext: q.content.trim(),
                type: formattedType,
                options,
                correctAnswer,
                points: q.points || 1
            });
            await newQuestion.save();
            assignment.question.push(newQuestion._id);
        }
    }

    await assignment.save();

    req.flash("success", "Cập nhật bài tập thành công!");
    res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments/${assignmentId}`);
};

// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/delete
module.exports.deleteAssignment = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(assignmentId)) {
        req.flash("error", "ID không hợp lệ!");
        return res.redirect("/courses");
    }
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.delete) {
        req.flash("error", "Không tìm thấy bài tập!");
        return res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
    }
    assignment.delete = true;
    await assignment.save();
    req.flash("success", "Đã xóa bài tập!");
    res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments`);
};

// [POST] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/submit
module.exports.submitAssignmentPost = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    const userId = req.user._id;

    try {
        //Lấy bài tập
        const assignment = await Assignment.findById(assignmentId).lean();
        if (!assignment) {
            req.flash('error', 'Không tìm thấy bài tập');
            return res.redirect('back');
        }
        // Lấy danh sách câu hỏi
        const questions = await Question.find({ assignmentId }).lean();
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        const userAnswers = req.body.answers || {};
        const answers = [];
        let totalCorrect = 0;

        // Chấm từng câu
        for (const [questionId, userAnswerRaw] of Object.entries(userAnswers)) {
            const question = questionMap[questionId];
            if (!question) continue;

            const correctAnswer = question.correctAnswer;
            let isCorrect = false;

            // Chuẩn hóa dữ liệu
            if (question.type === 'single-choice' || question.type === 'single_choice') {
                const userAnswer = String(userAnswerRaw).trim();
                isCorrect = userAnswer === correctAnswer;
                answers.push({
                    questionId: new mongoose.Types.ObjectId(questionId),
                    answer: userAnswer,
                    isCorrect
                });

            } else if (question.type === 'multiple-choice' || question.type === 'multiple_choice') {
                const userArray = Array.isArray(userAnswerRaw) ? userAnswerRaw : [userAnswerRaw];
                const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];

                const normalize = arr => arr.map(s => String(s).trim()).sort();
                isCorrect = JSON.stringify(normalize(userArray)) === JSON.stringify(normalize(correctArray));

                answers.push({
                    questionId: new mongoose.Types.ObjectId(questionId),
                    answer: userArray,
                    isCorrect
                });

            } else if (question.type === 'fill-in-blank') {
                const userAnswer = String(userAnswerRaw).trim().toLowerCase();
                const correct = String(correctAnswer).trim().toLowerCase();
                isCorrect = userAnswer === correct;

                answers.push({
                    questionId: new mongoose.Types.ObjectId(questionId),
                    answer: userAnswerRaw,
                    isCorrect
                });
            }
            console.log("==> ĐANG CHẤM CÂU:", question.questiontext);
            console.log("Correct:", correctAnswer);
            console.log("User:", userAnswerRaw);
            console.log("isCorrect?", isCorrect);

            if (isCorrect) totalCorrect++;
        }

        // Tính điểm
        const grade = Math.round((totalCorrect / questions.length) * 10);

        // Tạo submission
        await Submission.create({
            assignmentId,
            lessonId,
            courseId: assignment.courseId,
            userId,
            answers,
            status: 'graded',
            grade,
            content: req.body.content || '',
            submittedAt: new Date()
        });
        req.flash('success', `Nộp bài thành công! Bạn được ${grade}/10 điểm.`);
        res.redirect(`/courses/${slug}/lessons/${lessonId}/assignments/${assignmentId}`);

    } catch (err) {
        console.error('💥 LỖI NỘP BÀI:', err);
        req.flash('error', 'Có lỗi khi nộp bài!');
        res.redirect('back');
    }
};

// ...existing code...

// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/submissions
module.exports.listSubmissions = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    try {
        const course = await Course.findOne({ slug, delete: false });
        const lesson = await Lesson.findById(lessonId);
        const assignment = await Assignment.findById(assignmentId);
        if (!course || !lesson || !assignment) {
            req.flash("error", "Không tìm thấy dữ liệu!");
            return res.redirect("/courses");
        }
        // Nếu là giáo viên: xem tất cả, nếu là học viên: chỉ xem của mình
        let submissions;
        if (req.user.role === "teacher") {
            submissions = await Submission.find({ assignmentId })
                .populate("userId")
                .sort({ createdAt: -1 });
        } else {
            submissions = await Submission.find({ assignmentId, userId: req.user._id })
                .sort({ createdAt: -1 });
        }
        res.render("client/pages/assignments/submissions", {
            pageTitle: "Danh sách bài đã nộp",
            course,
            lesson,
            assignment,
            submissions
        });
    } catch (err) {
        console.error("Lỗi lấy danh sách bài nộp:", err);
        req.flash("error", "Không thể lấy danh sách bài nộp!");
        res.redirect("back");
    }
};

// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/submissions/:submissionId
module.exports.submissionDetail = async (req, res) => {
    const { slug, lessonId, assignmentId, submissionId } = req.params;
    try {
        const course = await Course.findOne({ slug, delete: false });
        const lesson = await Lesson.findById(lessonId);
        const assignment = await Assignment.findById(assignmentId).populate('question');
        const submission = await Submission.findById(submissionId)
            .populate("userId");
        if (!course || !lesson || !assignment || !submission) {
            req.flash("error", "Không tìm thấy dữ liệu!");
            return res.redirect("back");
        }
        // Map câu hỏi để hiển thị đáp án đúng/sai
        const questions = assignment.question || [];
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        res.render("client/pages/assignments/submission-detail", {
            pageTitle: "Chi tiết bài đã nộp",
            course,
            lesson,
            assignment,
            submission,
            questions,
            questionMap
        });
    } catch (err) {
        console.error("Lỗi xem chi tiết bài nộp:", err);
        req.flash("error", "Không thể xem chi tiết bài nộp!");
        res.redirect("back");
    }
};

// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/submissions
module.exports.listSubmissions = async (req, res) => {
    const { slug, lessonId, assignmentId } = req.params;
    try {
        const course = await Course.findOne({ slug, delete: false });
        const lesson = await Lesson.findById(lessonId);
        const assignment = await Assignment.findById(assignmentId);
        if (!course || !lesson || !assignment) {
            req.flash("error", "Không tìm thấy dữ liệu!");
            return res.redirect("/courses");
        }
        // Nếu là giáo viên: xem tất cả, nếu là học viên: chỉ xem của mình
        let submissions;
        if (req.user.role === "teacher") {
            submissions = await Submission.find({ assignmentId })
                .populate("userId")
                .sort({ createdAt: -1 });
        } else {
            submissions = await Submission.find({ assignmentId, userId: req.user._id })
                .sort({ createdAt: -1 });
        }
        res.render("client/pages/assignments/submissions", {
            pageTitle: "Danh sách bài đã nộp",
            course,
            lesson,
            assignment,
            submissions
        });
    } catch (err) {
        console.error("Lỗi lấy danh sách bài nộp:", err);
        req.flash("error", "Không thể lấy danh sách bài nộp!");
        res.redirect("back");
    }
};

// [GET] /courses/:slug/lessons/:lessonId/assignments/:assignmentId/submissions/:submissionId
module.exports.submissionDetail = async (req, res) => {
    const { slug, lessonId, assignmentId, submissionId } = req.params;
    try {
        const course = await Course.findOne({ slug, delete: false });
        const lesson = await Lesson.findById(lessonId);
        const assignment = await Assignment.findById(assignmentId).populate('question');
        const submission = await Submission.findById(submissionId)
            .populate("userId");
        if (!course || !lesson || !assignment || !submission) {
            req.flash("error", "Không tìm thấy dữ liệu!");
            return res.redirect("back");
        }
        // Map câu hỏi để hiển thị đáp án đúng/sai
        const questions = assignment.question || [];
        const questionMap = {};
        questions.forEach(q => {
            questionMap[q._id.toString()] = q;
        });

        res.render("client/pages/assignments/submission-detail", {
            pageTitle: "Chi tiết bài đã nộp",
            course,
            lesson,
            assignment,
            submission,
            questions,
            questionMap
        });
    } catch (err) {
        console.error("Lỗi xem chi tiết bài nộp:", err);
        req.flash("error", "Không thể xem chi tiết bài nộp!");
        res.redirect("back");
    }
};