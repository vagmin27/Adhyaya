import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateGetVideoComments = (req) => {
    const errors = [];
    const { videoId } = req.params || {};
    const query = req.query || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

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

    return errors;
};

export const validateAddComment = (req) => {
    const errors = [];
    const { videoId } = req.params || {};
    const body = req.body || {};

    if (!videoId || !isValidObjectId(videoId)) {
        errors.push({ field: "videoId", message: "Invalid video ID format" });
    }

    if (typeof body.content === "string") {
        body.content = body.content.trim();
    }

    if (!body.content || typeof body.content !== "string" || body.content.length === 0) {
        errors.push({ field: "content", message: "Comment content is required" });
    } else if (body.content.length > 1000) {
        errors.push({ field: "content", message: "Comment content cannot exceed 1000 characters" });
    }

    return errors;
};

export const validateUpdateComment = (req) => {
    const errors = [];
    const { commentId } = req.params || {};
    const body = req.body || {};

    if (!commentId || !isValidObjectId(commentId)) {
        errors.push({ field: "commentId", message: "Invalid comment ID format" });
    }

    if (typeof body.content === "string") {
        body.content = body.content.trim();
    }

    if (!body.content || typeof body.content !== "string" || body.content.length === 0) {
        errors.push({ field: "content", message: "Comment content is required" });
    } else if (body.content.length > 1000) {
        errors.push({ field: "content", message: "Comment content cannot exceed 1000 characters" });
    }

    return errors;
};

export const validateDeleteComment = (req) => {
    const errors = [];
    const { commentId } = req.params || {};

    if (!commentId || !isValidObjectId(commentId)) {
        errors.push({ field: "commentId", message: "Invalid comment ID format" });
    }

    return errors;
};

export const getVideoCommentsValidator = validate(validateGetVideoComments);
export const addCommentValidator = validate(validateAddComment);
export const updateCommentValidator = validate(validateUpdateComment);
export const deleteCommentValidator = validate(validateDeleteComment);
