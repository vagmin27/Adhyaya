import mongoose, { Schema } from "mongoose";

const courseSkillSchema = new Schema(
    {
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course is required"],
            index: true
        },
        skill: {
            type: Schema.Types.ObjectId,
            ref: "Skill",
            required: [true, "Skill is required"],
            index: true
        },
        importance: {
            type: Number,
            enum: [1, 2, 3], // 1 = supporting, 2 = important, 3 = core
            default: 1
        },
        targetLevel: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "intermediate"
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index ensuring a course cannot map the same skill twice
courseSkillSchema.index({ course: 1, skill: 1 }, { unique: true });

export const CourseSkill = mongoose.model("CourseSkill", courseSkillSchema);
