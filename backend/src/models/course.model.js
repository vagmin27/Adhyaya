import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const courseSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true,
            index: true
        },
        slug: {
            type: String,
            required: [true, "Course slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        subtitle: {
            type: String,
            trim: true,
            default: ""
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        thumbnail: {
            type: String, // Cloudinary or image URL
            default: ""
        },
        instructor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Instructor is required"],
            index: true
        },
        category: {
            type: String,
            trim: true,
            default: "General",
            index: true
        },
        level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "all_levels"],
            default: "all_levels",
            index: true
        },
        tags: [
            {
                type: String,
                trim: true
            }
        ],
        isPublished: {
            type: Boolean,
            default: false,
            index: true
        },
        totalDuration: {
            type: Number, // Total duration in seconds cached from lessons
            default: 0
        },
        totalLessons: {
            type: Number, // Total number of lessons cached from lessons
            default: 0
        }
    },
    {
        timestamps: true
    }
);

courseSchema.plugin(mongooseAggregatePaginate);

// Compound indexes for optimal catalog filtering and searching
courseSchema.index({ isPublished: 1, category: 1, createdAt: -1 });
courseSchema.index({ isPublished: 1, level: 1 });
courseSchema.index({ instructor: 1, createdAt: -1 });

export const Course = mongoose.model("Course", courseSchema);
