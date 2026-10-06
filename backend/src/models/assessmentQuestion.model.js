import mongoose, { Schema } from "mongoose";

const assessmentQuestionSchema = new Schema(
    {
        assessment: {
            type: Schema.Types.ObjectId,
            ref: "Assessment",
            required: [true, "Assessment reference is required"],
            index: true
        },
        type: {
            type: String,
            enum: ["mcq"],
            default: "mcq",
            required: true
        },
        questionText: {
            type: String,
            required: [true, "Question text is required"],
            trim: true
        },
        options: {
            type: [String],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length >= 2;
                },
                message: "A multiple-choice question must have at least 2 options"
            },
            required: true
        },
        correctOption: {
            type: Number,
            required: [true, "Correct option index is required"],
            min: [0, "Correct option index must be non-negative"]
        },
        marks: {
            type: Number,
            default: 1,
            min: [1, "Marks must be at least 1"]
        },
        explanation: {
            type: String,
            default: "",
            trim: true
        },
        order: {
            type: Number,
            default: 1,
            min: [1, "Order must be at least 1"]
        }
    },
    {
        timestamps: true
    }
);

// Order index per assessment
assessmentQuestionSchema.index({ assessment: 1, order: 1 });

export const AssessmentQuestion = mongoose.model("AssessmentQuestion", assessmentQuestionSchema);
