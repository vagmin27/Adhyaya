import mongoose, { Schema } from "mongoose";

const skillSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Skill name is required"],
            trim: true,
            maxlength: [100, "Skill name cannot exceed 100 characters"]
        },
        slug: {
            type: String,
            required: [true, "Skill slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: [1000, "Description cannot exceed 1000 characters"]
        },
        category: {
            type: String,
            trim: true,
            default: "General",
            index: true
        },
        parentSkill: {
            type: Schema.Types.ObjectId,
            ref: "Skill",
            default: null
        },
        prerequisites: [
            {
                type: Schema.Types.ObjectId,
                ref: "Skill"
            }
        ],
        relatedSkills: [
            {
                type: Schema.Types.ObjectId,
                ref: "Skill"
            }
        ],
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "intermediate"
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Basic self-reference prevention hook
skillSchema.pre("validate", function (next) {
    if (this._id) {
        const idStr = this._id.toString();
        if (this.parentSkill && this.parentSkill.toString() === idStr) {
            return next(new Error("A skill cannot be its own parent"));
        }
        if (this.prerequisites && this.prerequisites.some((p) => p.toString() === idStr)) {
            return next(new Error("A skill cannot be a prerequisite of itself"));
        }
        if (this.relatedSkills && this.relatedSkills.some((r) => r.toString() === idStr)) {
            return next(new Error("A skill cannot be related to itself"));
        }
    }
    next();
});

skillSchema.index({ name: 1 });

export const Skill = mongoose.model("Skill", skillSchema);
