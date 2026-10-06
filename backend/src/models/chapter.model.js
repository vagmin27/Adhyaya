import mongoose, { Schema } from "mongoose";

const chapterSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Chapter title is required"],
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
        order: {
            type: Number,
            required: [true, "Chapter order index is required"],
            default: 1
        }
    },
    {
        timestamps: true
    }
);

// Compound index to optimize ordering of chapters within a course
chapterSchema.index({ course: 1, order: 1 });

export const Chapter = mongoose.model("Chapter", chapterSchema);
