import mongoose, { Schema } from "mongoose";

const enrollmentSchema = new Schema(
    {
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student reference is required"],
            index: true
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course reference is required"],
            index: true
        },
        status: {
            type: String,
            enum: ["active", "completed", "dropped"],
            default: "active",
            index: true
        },
        progressPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        completedLessonsCount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalLessonsCount: {
            type: Number,
            default: 0,
            min: 0
        },
        lastAccessedLesson: {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
            default: null
        },
        lastAccessedAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        completedAt: {
            type: Date,
            default: null
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate enrollment records for the same student and course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Optimize "Continue Learning" and enrolled courses dashboard queries
enrollmentSchema.index({ student: 1, status: 1, lastAccessedAt: -1 });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
