const mongoose = require("mongoose");
slug = require('mongoose-slug-updater'),

mongoose.plugin(slug)

const courseSchema = new mongoose.Schema(
    { 
        title: String,
        description: String,
        teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        teacherIDs: [{ type: String }],
        teacherNames: [{ type: String }],
        teacherEmails: [{ type: String }],
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
        thumbnail: {
            type: String,
            default: "https://lms-management-demo.s3.ap-southeast-1.amazonaws.com/default-course-thumbnail.png"
        },
        createdAt: Date,
        updatedAt: Date,
        status: String,
        slug: { 
            type: String, 
            slug: "title",
            unique: true
        },
        delete: {
            type: Boolean,
            default: false
        },
        deleteAt: Date,
    },
    {
        timestamps: true
    }
);

const Course = mongoose.model("Course", courseSchema, "courses");

module.exports = Course;
