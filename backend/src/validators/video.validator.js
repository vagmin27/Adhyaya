import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

const ALLOWED_SORT_FIELDS = ["createdAt", "views", "duration", "title"];
const ALLOWED_SORT_TYPES = ["asc", "desc"];

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

export const getAllVideosValidator = validate(validateGetAllVideos);
export const getVideoByIdValidator = validate(validateGetVideoById);
