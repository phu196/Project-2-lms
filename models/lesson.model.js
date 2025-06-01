const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pdfUrl: String,
  content: String,
  description: String,
  videoType: { type: String, enum: ['youtube', 'vimeo', 'local'], default: 'local' },
  videoUrl: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
  order: { type: Number, default: 0 },
  delete: {
    type: Boolean,
    default: false
  },
    deleteAt: Date
}, 
{ timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
