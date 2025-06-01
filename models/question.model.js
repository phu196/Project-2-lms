const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    questiontext: {
        type: String,
        required: true
    },
    mediaUrl: { // Link ảnh hoặc PDF
        type: String,
        default: null
    },
    mediaType: { // 'image' hoặc 'pdf'
        type: String,
        enum: ['image', 'pdf', null],
        default: null
    },
    type: {
        type: String,
        enum: ['single-choice', 'multiple-choice', 'short-answer', 'fill-in-blank', 'file-upload'],
        required: true
    },
    options: [{
        optionText: String,
        isCorrect: Boolean
    }],
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed, // Can be a string or an array depending on the question type
        required: true
    },
    points: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

const Question = mongoose.model('Question', questionSchema, 'questions');
module.exports = Question;