import mongoose, { Schema } from "mongoose";

const lessonSkillSchema = new Schema(
    {
        lesson: {
            type: Schema.Types.ObjectId,
            ref: "Lesson",
            required: [true, "Lesson is required"],
            index: true
        },
        skill: {
            type: Schema.Types.ObjectId,
            ref: "Skill",
            required: [true, "Skill is required"],
            index: true
        },
        contributionWeight: {
            type: Number,
            default: 1,
            min: [0.1, "Contribution weight must be positive"]
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index ensuring a lesson cannot map the same skill twice
lessonSkillSchema.index({ lesson: 1, skill: 1 }, { unique: true });

export const LessonSkill = mongoose.model("LessonSkill", lessonSkillSchema);
