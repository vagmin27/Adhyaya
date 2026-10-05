import fs from "fs";
import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

const ALLOWED_SORT_FIELDS = ["createdAt", "views", "duration", "title"];
const ALLOWED_SORT_TYPES = ["asc", "desc"];

const cleanupFiles = (files) => {
    if (!files) return;
    const fileList = Array.isArray(files) ? files : Object.values(files).flat();
    fileList.forEach((file) => {
        if (file?.path) {
            try {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            } catch (err) {
                // Ignore cleanup error
            }
        }
    });
};

export const validateGetAllVideos = (req) => {
    const errors = [];
    const query = req.query || {};

    // page validation & normalization
    if (query.page !== undefined && query.page !== "") {
        const pageNum = Number(query.page);
        if (!Number.isInteger(pageNum) || pageNum < 1) {
            errors.push({ field: "page", message: "Page must be a positive integer" });
        } else {
            req.query.page = pageNum;
        }
    } else {
        req.query.page = 1;
    }

    // limit validation & normalization (min 1, max 50)
    if (query.limit !== undefined && query.limit !== "") {
        const limitNum = Number(query.limit);
        if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
            errors.push({ field: "limit", message: "Limit must be an integer between 1 and 50" });
        } else {
            req.query.limit = limitNum;
        }
    } else {
        req.query.limit = 10;
    }

    // sortBy validation & normalization
    if (query.sortBy !== undefined && query.sortBy !== "") {
        if (!ALLOWED_SORT_FIELDS.includes(query.sortBy)) {
            errors.push({
                field: "sortBy",
                message: `Sort by must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`
            });
        }
    } else {
        req.query.sortBy = "createdAt";
    }

    // sortType validation & normalization
    if (query.sortType !== undefined && query.sortType !== "") {
        const normalizedSortType = String(query.sortType).toLowerCase();
        if (!ALLOWED_SORT_TYPES.includes(normalizedSortType)) {
            errors.push({
                field: "sortType",
                message: "Sort type must be either 'asc' or 'desc'"
            });
        } else {
            req.query.sortType = normalizedSortType;
        }
    } else {
        req.query.sortType = "desc";
    }

    // userId validation if provided
    if (query.userId !== undefined && query.userId !== "") {
        if (!isValidObjectId(query.userId)) {
            errors.push({ field: "userId", message: "Invalid user ID format" });
        }
    }

    // query string normalization
    if (typeof query.query === "string") {
        req.query.query = query.query.trim();
    }

    return errors;
};

export const validateGetVideoById = (req) => {
    const errors = [];
    const { videoId } = req.params || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    return errors;
};

export const validatePublishVideo = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.title === "string") {
        body.title = body.title.trim();
    }
    if (typeof body.description === "string") {
        body.description = body.description.trim();
    }

    if (!body.title || typeof body.title !== "string" || body.title.length === 0) {
        errors.push({ field: "title", message: "Title is required" });
    } else if (body.title.length < 3 || body.title.length > 150) {
        errors.push({ field: "title", message: "Title must be between 3 and 150 characters" });
    }

    if (!body.description || typeof body.description !== "string" || body.description.length === 0) {
        errors.push({ field: "description", message: "Description is required" });
    } else if (body.description.length < 5 || body.description.length > 3000) {
        errors.push({ field: "description", message: "Description must be between 5 and 3000 characters" });
    }

    const videoFile = req.files?.videoFile?.[0];
    if (!videoFile || !videoFile.path) {
        errors.push({ field: "videoFile", message: "Video file is required" });
    }

    const thumbnail = req.files?.thumbnail?.[0];
    if (!thumbnail || !thumbnail.path) {
        errors.push({ field: "thumbnail", message: "Thumbnail is required" });
    }

    if (errors.length > 0 && req.files) {
        cleanupFiles(req.files);
    }

    return errors;
};

export const validateUpdateVideo = (req) => {
    const errors = [];
    const { videoId } = req.params || {};
    const body = req.body || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    if (typeof body.title === "string") {
        body.title = body.title.trim();
    }
    if (typeof body.description === "string") {
        body.description = body.description.trim();
    }

    const hasTitle = Boolean(body.title && body.title.length > 0);
    const hasDescription = Boolean(body.description && body.description.length > 0);
    const hasThumbnail = Boolean(req.file?.path);

    if (!hasTitle && !hasDescription && !hasThumbnail) {
        errors.push({
            field: "body",
            message: "At least one field (title, description, or thumbnail) must be provided to update"
        });
    }

    if (hasTitle && (body.title.length < 3 || body.title.length > 150)) {
        errors.push({ field: "title", message: "Title must be between 3 and 150 characters" });
    }

    if (hasDescription && (body.description.length < 5 || body.description.length > 3000)) {
        errors.push({ field: "description", message: "Description must be between 5 and 3000 characters" });
    }

    if (errors.length > 0 && req.file) {
        cleanupFiles([req.file]);
    }

    return errors;
};

export const validateDeleteVideo = (req) => {
    const errors = [];
    const { videoId } = req.params || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    return errors;
};

export const validateTogglePublishStatus = (req) => {
    const errors = [];
    const { videoId } = req.params || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    return errors;
};

export const getAllVideosValidator = validate(validateGetAllVideos);
export const getVideoByIdValidator = validate(validateGetVideoById);
export const publishVideoValidator = validate(validatePublishVideo);
export const updateVideoValidator = validate(validateUpdateVideo);
export const deleteVideoValidator = validate(validateDeleteVideo);
export const togglePublishStatusValidator = validate(validateTogglePublishStatus);
