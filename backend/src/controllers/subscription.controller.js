import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const channelId = req.params?.channelId || req.params?.subscriberId;

    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (req.user._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "Unsubscribed successfully"
                )
            );
    }

    try {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
    } catch (err) {
        if (err?.code === 11000) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { subscribed: true },
                        "Subscribed successfully"
                    )
                );
        }
        throw err;
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "Subscribed successfully"
            )
        );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const channelId = req.params?.channelId || req.params?.subscriberId;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber"
                }
            }
        },
        {
            $match: {
                "subscriber._id": { $exists: true }
            }
        },
        {
            $project: {
                _id: 1,
                subscriber: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.params?.subscriberId || req.params?.channelId;

    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "User not found");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        },
        {
            $match: {
                "channel._id": { $exists: true }
            }
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channels,
                "Subscribed channels fetched successfully"
            )
        );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};