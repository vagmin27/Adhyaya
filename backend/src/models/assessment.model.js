import mongoose, { Schema } from "mongoose";

const assessmentSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Assessment title is required"],
            trim: true
        },
        description: {
            type: String,
            default: "",
            trim: true
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
            default: null,
            index: true
        },
        instructor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Instructor reference is required"],
            index: true
        },
        instructions: {
            type: String,
            default: "",
            trim: true
        },
        passingPercentage: {
            type: Number,
            default: 40,
            min: [0, "Passing percentage cannot be negative"],
            max: [100, "Passing percentage cannot exceed 100"]
        },
        timeLimitMinutes: {
            type: Number,
            default: 30,
            min: [1, "Time limit must be at least 1 minute"]
        },
        maxAttempts: {
            type: Number,
            default: 3,
            min: [1, "Max attempts must be at least 1"]
        },
        isPublished: {
            type: Boolean,
            default: false,
            index: true
        },
        totalQuestions: {
            type: Number,
            default: 0,
            min: 0
        },
        totalMarks: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// Indexes for course assessments and instructor lookups
assessmentSchema.index({ course: 1, isPublished: 1 });
assessmentSchema.index({ course: 1, chapter: 1 });
assessmentSchema.index({ instructor: 1, createdAt: -1 });

export const Assessment = mongoose.model("Assessment", assessmentSchema);
