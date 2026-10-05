import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.query?.userId && req.query.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to access another user's dashboard");
    }

    const channelOwnerId = new mongoose.Types.ObjectId(userId);

    // Aggregate video metrics and subscriber count concurrently
    const [videoStats, totalSubscribers] = await Promise.all([
        Video.aggregate([
            {
                $match: {
                    owner: channelOwnerId
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: { $size: "$likes" } }
                }
            }
        ]),
        Subscription.countDocuments({
            channel: channelOwnerId
        })
    ]);

    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers: totalSubscribers || 0,
        totalLikes: videoStats[0]?.totalLikes || 0
    };

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.query?.userId && req.query.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to access another user's dashboard");
    }

    const channelOwnerId = new mongoose.Types.ObjectId(userId);
    const page = parseInt(req.query?.page, 10) || 1;
    const limit = parseInt(req.query?.limit, 10) || 10;

    const pipeline = [
        {
            $match: {
                owner: channelOwnerId
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },
        {
            $project: {
                likes: 0
            }
        }
    ];

    const aggregate = Video.aggregate(pipeline);
    const videos = await Video.aggregatePaginate(aggregate, {
        page,
        limit
    });

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats,
    getChannelVideos
};