const express = require("express");
const router = express.Router();
const multer = require('multer');

const upload = multer();

const controller = require("../../controllers/admin/account.controller");

router.get("/", controller.index);

router.get("/create", controller.create);

router.post("/create", upload.single('avatar'), controller.createPost);

router.get("/edit/:id", controller.edit);

router.patch("/edit/:id", upload.single('avatar'), controller.editPatch);

router.get("/change-password/:id", controller.changePassword);

router.patch("/change-password/:id", controller.changePasswordPatch);

router.get("/my-profile", controller.myProfile);

module.exports = router;