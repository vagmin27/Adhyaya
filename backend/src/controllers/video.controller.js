import fs from "fs"
import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const pipeline = [];

    // Filter by published videos only
    const match = {
        isPublished: true
    };

    if (query && typeof query === "string" && query.trim() !== "") {
        match.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } }
        ];
    }

    if (userId) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    pipeline.push({ $match: match });

    // Sort order
    const sortOrder = String(sortType).toLowerCase() === "asc" ? 1 : -1;
    pipeline.push({
        $sort: {
            [sortBy]: sortOrder
        }
    });

    // Lookup owner basic details
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first: "$owner"
                }
            }
        }
    );

    const aggregate = Video.aggregate(pipeline);
    const videos = await Video.aggregatePaginate(aggregate, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
    });

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        if (videoFileLocalPath && fs.existsSync(videoFileLocalPath)) {
            try { fs.unlinkSync(videoFileLocalPath); } catch (_) {}
        }
        if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) {
            try { fs.unlinkSync(thumbnailLocalPath); } catch (_) {}
        }
        throw new ApiError(400, "Both video file and thumbnail are required");
    }

    try {
        const videoFile = await uploadOnCloudinary(videoFileLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoFile?.url) {
            throw new ApiError(500, "Error uploading video file to Cloudinary");
        }

        if (!thumbnail?.url) {
            throw new ApiError(500, "Error uploading thumbnail to Cloudinary");
        }

        const video = await Video.create({
            title,
            description,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration || 0,
            owner: req.user._id,
            isPublished: true
        });

        const createdVideo = await Video.findById(video._id);

        if (!createdVideo) {
            throw new ApiError(500, "Something went wrong while publishing the video");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, createdVideo, "Video published successfully"));
    } finally {
        if (videoFileLocalPath && fs.existsSync(videoFileLocalPath)) {
            try { fs.unlinkSync(videoFileLocalPath); } catch (_) {}
        }
        if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) {
            try { fs.unlinkSync(thumbnailLocalPath); } catch (_) {}
        }
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    if (!video?.length) {
        throw new ApiError(404, "Video not found");
    }

    // Increment views by 1 only after finding the video
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    const videoData = video[0];
    videoData.views = (videoData.views || 0) + 1;

    return res
        .status(200)
        .json(new ApiResponse(200, videoData, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        if (video.owner.toString() !== req.user?._id?.toString()) {
            throw new ApiError(403, "You do not have permission to update this video");
        }

        if (title && title.trim() !== "") {
            video.title = title.trim();
        }

        if (description && description.trim() !== "") {
            video.description = description.trim();
        }

        if (thumbnailLocalPath) {
            const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
            if (!thumbnail?.url) {
                throw new ApiError(500, "Error uploading new thumbnail");
            }
            video.thumbnail = thumbnail.url;
        }

        await video.save();

        return res
            .status(200)
            .json(new ApiResponse(200, video, "Video updated successfully"));
    } finally {
        if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) {
            try { fs.unlinkSync(thumbnailLocalPath); } catch (_) {}
        }
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id?.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id?.toString()) {
        throw new ApiError(403, "You do not have permission to modify this video");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video publish status updated successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
