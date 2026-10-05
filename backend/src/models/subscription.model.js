import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // one who is subscribing
            ref: "User",
            required: true
        },
        channel: {
            type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// Compound unique index to prevent duplicate subscriptions at the database level
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

// Index for channel lookups (fetching subscribers of a channel)
subscriptionSchema.index({ channel: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);