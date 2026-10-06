import mongoose, { Schema } from "mongoose";

const lessonSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Lesson title is required"],
            trim: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        chapter: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: [true, "Chapter reference is required"],
            index: true
        },
        course: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course reference is required"],
            index: true
        },
        order: {
            type: Number,
            required: [true, "Lesson order index is required"],
            default: 1
        },
        type: {
            type: String,
            enum: ["video", "article"],
            default: "video",
            required: [true, "Lesson type is required"]
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: null
        },
        content: {
            type: String, // Markdown or text content for article lessons
            default: ""
        },
        duration: {
            type: Number, // Duration in seconds (from video or estimated reading time)
            default: 0
        },
        isFreePreview: {
            type: Boolean,
            default: false
        },
        attachments: [
            {
                title: { type: String, trim: true },
                url: { type: String, trim: true }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Compound indexes for efficient curriculum queries
lessonSchema.index({ chapter: 1, order: 1 });
lessonSchema.index({ course: 1, chapter: 1, order: 1 });

export const Lesson = mongoose.model("Lesson", lessonSchema);
