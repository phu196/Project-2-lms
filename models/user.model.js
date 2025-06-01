const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
		token: String,
    phone: String,
    avatar: String,
    status: String,
    role: {
      type: String,
      required: true,
      enum: ["teacher", "student"],
      default: "student"
    },
    teacherID: {
      type: String,
      required: function() { return this.role === "teacher"; },
      default: null
    },
    createdAt: Date,
    updatedAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "users");

module.exports = User;