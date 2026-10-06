import mongoose, { Schema } from "mongoose";

const attemptAnswerSchema = new Schema(
    {
        question: {
            type: Schema.Types.ObjectId,
            ref: "AssessmentQuestion",
            required: true
        },
        selectedOption: {
            type: Number,
            default: null
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        marksAwarded: {
            type: Number,
            default: 0
        }
    },
    { _id: false }
);

const assessmentAttemptSchema = new Schema(
    {
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student reference is required"],
            index: true
        },
        assessment: {
            type: Schema.Types.ObjectId,
            ref: "Assessment",
            required: [true, "Assessment reference is required"],
            index: true
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course reference is required"],
            index: true
        },
        attemptNumber: {
            type: Number,
            required: true,
            min: 1
        },
        startedAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        submittedAt: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ["in_progress", "submitted", "expired"],
            default: "in_progress",
            index: true
        },
        score: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        passed: {
            type: Boolean,
            default: false
        },
        totalMarks: {
            type: Number,
            default: 0
        },
        earnedMarks: {
            type: Number,
            default: 0
        },
        answers: [attemptAnswerSchema]
    },
    {
        timestamps: true
    }
);

// Unique attempt number per student per assessment
assessmentAttemptSchema.index(
    { student: 1, assessment: 1, attemptNumber: 1 },
    { unique: true }
);

// Optimized lookup for active student attempts and history
assessmentAttemptSchema.index({ student: 1, assessment: 1, status: 1 });
assessmentAttemptSchema.index({ student: 1, course: 1, passed: 1 });

export const AssessmentAttempt = mongoose.model("AssessmentAttempt", assessmentAttemptSchema);
