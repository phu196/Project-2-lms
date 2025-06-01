const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  question: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    }
  ],
  dueDate: Date,
  delete: {
    type: Boolean,
    default: false
  },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
