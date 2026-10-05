import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Playlist name is required"],
            trim: true
        },
        description: {
            type: String,
            required: [true, "Playlist description is required"],
            trim: true
        },
        videos: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Index to optimize querying user's playlists sorted by creation date
playlistSchema.index({ owner: 1, createdAt: -1 });

export const Playlist = mongoose.model("Playlist", playlistSchema);