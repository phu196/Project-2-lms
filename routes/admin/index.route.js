const systemConfig = require("../../config/systems")
const authMiddleware = require("../../middlewares/admin/auth.middleware");

const dashboardRoutes = require("./dashboard.route")
const courseRoutes = require("./course.route")
const roleRoutes = require("./role.route");
const accountRoutes = require("./account.route");
const authRoutes = require("./auth.route");
const userRoutes = require("./user.route");

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin

    app.use(`${PATH_ADMIN}/dashboard`, authMiddleware.requireAuth, dashboardRoutes);
      
    app.use(`${PATH_ADMIN}/courses`, authMiddleware.requireAuth, courseRoutes);

    app.use(`${PATH_ADMIN}/roles`, authMiddleware.requireAuth, roleRoutes);
    
    app.use(`${PATH_ADMIN}/accounts`, authMiddleware.requireAuth, accountRoutes);

    app.use(`${PATH_ADMIN}/users`, authMiddleware.requireAuth, userRoutes);

    app.use(`${PATH_ADMIN}/auth`, authRoutes);

}