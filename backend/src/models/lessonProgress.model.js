import mongoose, { Schema } from "mongoose";

const lessonProgressSchema = new Schema(
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
        chapter: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: [true, "Chapter reference is required"],
            index: true
        },
        lesson: {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
            required: [true, "Lesson reference is required"],
            index: true
        },
        isCompleted: {
            type: Boolean,
            default: false,
            index: true
        },
        completedAt: {
            type: Date,
            default: null
        },
        secondsWatched: {
            type: Number,
            default: 0,
            min: 0
        },
        lastPositionSeconds: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// One progress document per student per lesson
lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

// Optimize course-wide progress calculations and completion checks
lessonProgressSchema.index({ student: 1, course: 1, isCompleted: 1 });

export const LessonProgress = mongoose.model("LessonProgress", lessonProgressSchema);
