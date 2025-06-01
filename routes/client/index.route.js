const homeRoute = require("./home.route")
const courseRoute = require("./course.route")
const userRoute = require("./user.route");

const userMiddleware = require("../../middlewares/client/user.middleware");
const { application } = require("express");

module.exports = (app) => {
    app.use(userMiddleware.infoUser);

    app.use('/', homeRoute)
    app.use('/courses', courseRoute)
    app.use("/user", userRoute);

}