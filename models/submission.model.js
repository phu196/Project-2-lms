const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        answer: {
            type: mongoose.Schema.Types.Mixed, // string hoặc array
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    content: {
        type: String
    },
    status: {
        type: String,
        enum: ['submitted', 'graded', 'revised'],
        default: 'submitted'
    },
    grade: {
        type: Number,
        default: null
    },
    feedback: String
}, {
    timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema, 'submissions');
module.exports = Submission;
