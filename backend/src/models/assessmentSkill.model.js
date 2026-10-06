import mongoose, { Schema } from "mongoose";

const assessmentSkillSchema = new Schema(
    {
        assessment: {
            type: Schema.Types.ObjectId,
            ref: "Assessment",
            required: [true, "Assessment is required"],
            index: true
        },
        skill: {
            type: Schema.Types.ObjectId,
            ref: "Skill",
            required: [true, "Skill is required"],
            index: true
        },
        weight: {
            type: Number,
            default: 1,
            min: [0.1, "Weight must be positive"]
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index ensuring an assessment cannot map the same skill twice
assessmentSkillSchema.index({ assessment: 1, skill: 1 }, { unique: true });

export const AssessmentSkill = mongoose.model("AssessmentSkill", assessmentSkillSchema);
