import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "Tweet content is required"],
            trim: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

// Compound index to optimize querying user's tweets sorted by creation date
tweetSchema.index({ owner: 1, createdAt: -1 });

export const Tweet = mongoose.model("Tweet", tweetSchema);