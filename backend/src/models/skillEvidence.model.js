import mongoose, { Schema } from "mongoose";

const skillEvidenceSchema = new Schema(
    {
        student: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Student is required"],
            index: true
        },
        skill: {
            type: Schema.Types.ObjectId,
            ref: "Skill",
            required: [true, "Skill is required"],
            index: true
        },
        sourceType: {
            type: String,
            enum: ["lesson", "assessment"],
            required: [true, "Source type is required"]
        },
        sourceId: {
            type: Schema.Types.ObjectId,
            required: [true, "Source ID is required"]
        },
        score: {
            type: Number,
            required: [true, "Score is required"],
            min: [0, "Score cannot be less than 0"],
            max: [100, "Score cannot exceed 100"]
        },
        weight: {
            type: Number,
            required: [true, "Weight is required"],
            min: [0.01, "Weight must be positive"],
            default: 1
        },
        achievedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Idempotency: a student has at most one evidence record per specific learning source event
skillEvidenceSchema.index({ student: 1, skill: 1, sourceType: 1, sourceId: 1 }, { unique: true });
skillEvidenceSchema.index({ student: 1, skill: 1 });
skillEvidenceSchema.index({ student: 1, skill: 1, sourceType: 1 });

export const SkillEvidence = mongoose.model("SkillEvidence", skillEvidenceSchema);
