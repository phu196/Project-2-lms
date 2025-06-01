const express = require('express')
const multer  = require('multer')
const router = express.Router()
const storageMulter = require("../../helpers/storageMulter")
const upload = multer({ storage: storageMulter() })

const controller = require("../../controllers/admin/course.controller")

router.get('/', controller.index)
router.patch('/change-status/:status/:id', controller.changeStatus)
router.delete('/delete/:id', controller.deleteItem)
router.get('/create', controller.create)
router.post('/create',upload.single('thumbnail'), controller.createPost)
router.get('/edit/:id', controller.edit)
router.patch('/edit/:id',upload.single('thumbnail'), controller.editPatch)
router.get("/detail/:id", controller.detail);
module.exports = router