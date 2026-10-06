import mongoose, { Schema } from "mongoose";

const studentSkillSchema = new Schema(
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
        masteryPercentage: {
            type: Number,
            default: 0,
            min: [0, "Mastery percentage cannot be less than 0"],
            max: [100, "Mastery percentage cannot exceed 100"]
        },
        evidenceCount: {
            type: Number,
            default: 0,
            min: 0
        },
        lastEvidenceAt: {
            type: Date,
            default: null
        },
        lastCalculatedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Unique compound index: a student has exactly one summary state per skill
studentSkillSchema.index({ student: 1, skill: 1 }, { unique: true });
studentSkillSchema.index({ student: 1, masteryPercentage: -1 });

export const StudentSkill = mongoose.model("StudentSkill", studentSkillSchema);
