const Course = require("../../models/course.model")

const systemConfig = require("../../config/systems")

const filterStatusHelper = require("../../helpers/filterStatus")
const searchHelper = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")

// [GET] /admin/products
module.exports.index = async (req, res) => {
    // console.log(req.query.status)

    const filterStatus = filterStatusHelper(req.query)
    // console.log(filterStatus)

    let find = {
        delete: false,
    }
    if (req.query.status) {
        find.status = req.query.status
    }

    const objectSearch = searchHelper(req.query);
    // console.log(objectSearch)

    if (objectSearch.regex) {
        find.title = objectSearch.regex;
    }

    // Pagination
    const countCourses = await Course.countDocuments(find)

    let objectPagination = paginationHelper(
        {
            currentPage: 1,
            limitItems: 4
        },
        req.query,
        countCourses
    )

    const courses = await Course.find(find).limit(objectPagination.limitItems).skip(objectPagination.skip)

    // console.log(courses)

    res.render("admin/pages/courses/index", {
        pageTitle: "Danh sách khóa học",
        courses: courses,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
    })
}

// [GET] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    const status = req.params.status
    const id = req.params.id

    await Course.updateOne({ _id: id }, { status: status })

    res.redirect('back')
}

// [DELETE] /admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {
    const id = req.params.id

    // await Course.deleteOne({_id: id})
    await Course.updateOne({ _id: id }, {
        delete: true,
        deleteAt: new Date()
    })
    res.redirect('back')
}

// [GET] /admin/products/create
module.exports.create = async (req, res) => {
    res.render("admin/pages/courses/create", {
        pageTitle: "Thêm mới khóa học",
    })
}

// [POST] /admin/products/create
module.exports.createPost = async (req, res) => {
    try {
        const data = req.body;

        // Kiểm tra nếu lessons là số thì giữ nguyên, nếu là mảng thì convert
        if (Array.isArray(data.lessons)) {
            data.lessons = data.lessons.map(lesson => mongoose.Types.ObjectId(lesson));
        } else if (!isNaN(data.lessons)) {
            data.lessons = parseInt(data.lessons); // hoặc giữ nguyên nếu schema là Number
        }

        // Nếu có upload ảnh
        if (req.file) {
            data.thumbnail = req.file.filename;
        }

        const course = new Course(data);
        await course.save();

        req.flash("success", "Khóa học đã được tạo thành công!");
        res.redirect(`${systemConfig.prefixAdmin}/courses`);
    } catch (error) {
        console.error("Error creating course:", error.message); // thêm .message
        req.flash("error", "Đã xảy ra lỗi khi tạo khóa học!");
        res.redirect("back");
    }
};

// [GET] /admin/products/edit/:id
module.exports.edit = async (req, res) => {
    try {
        // console.log(req.params.id)

        const find = {
            delete: false,
            _id: req.params.id
        }

        const course = await Course.findOne(find)

        // console.log(course)

        res.render("admin/pages/courses/edit", {
            pageTitle: "Chỉnh sửa khóa học",
            course: course
        })
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/courses`);
    }

}

// [PATCH] /admin/products/edit/:id
module.exports.editPatch = async (req, res) => {
    const id = req.params.id
    req.body.price = parseFloat(req.body.price)
    req.body.discountPercentage = parseFloat(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    req.body.position = parseInt(req.body.position)

    if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`
    }

    try {
        await Course.updateOne({ _id: id }, req.body)
    } catch (error) {

    }

    res.redirect(`back`);
}

// [GET] /admin/products/detail/:id
module.exports.detail = async (req, res) => {
    try {
        // console.log(req.params.id)

        const find = {
            delete: false,
            _id: req.params.id
        }

        const course = await Course.findOne(find)

        console.log(course)

        res.render("admin/pages/courses/detail", {
            pageTitle: course.title,
            course: course
        })
    } catch (error) {
        res.redirect(`${systemConfig.prefixAdmin}/courses`);
    }
}