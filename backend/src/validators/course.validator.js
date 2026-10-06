import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

const ALLOWED_LEVELS = ["beginner", "intermediate", "advanced", "all_levels"];
const ALLOWED_SORT_FIELDS = ["createdAt", "title", "totalDuration", "totalLessons"];
const ALLOWED_SORT_TYPES = ["asc", "desc"];
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const validateCreateCourse = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.title === "string") {
        body.title = body.title.trim();
    }

    if (!body.title || typeof body.title !== "string" || body.title.length < 3) {
        errors.push({ field: "title", message: "Course title is required and must be at least 3 characters" });
    }

    if (body.slug !== undefined && body.slug !== "") {
        body.slug = String(body.slug).trim().toLowerCase();
        if (!SLUG_REGEX.test(body.slug)) {
            errors.push({
                field: "slug",
                message: "Slug must contain only lowercase alphanumeric characters and single hyphens"
            });
        }
    }

    if (body.level !== undefined && body.level !== "") {
        if (!ALLOWED_LEVELS.includes(body.level)) {
            errors.push({
                field: "level",
                message: `Level must be one of: ${ALLOWED_LEVELS.join(", ")}`
            });
        }
    }

    if (body.tags !== undefined) {
        if (!Array.isArray(body.tags) && typeof body.tags !== "string") {
            errors.push({ field: "tags", message: "Tags must be an array of strings or comma-separated string" });
        }
    }

    return errors;
};

export const validateUpdateCourse = (req) => {
    const errors = [];
    const body = req.body || {};
    const { courseId } = req.params || {};

    if (!courseId || !isValidObjectId(courseId)) {
        errors.push({ field: "courseId", message: "Invalid or missing course ID" });
    }

    if (body.title !== undefined) {
        body.title = String(body.title).trim();
        if (body.title.length < 3) {
            errors.push({ field: "title", message: "Course title must be at least 3 characters" });
        }
    }

    if (body.slug !== undefined && body.slug !== "") {
        body.slug = String(body.slug).trim().toLowerCase();
        if (!SLUG_REGEX.test(body.slug)) {
            errors.push({
                field: "slug",
                message: "Slug must contain only lowercase alphanumeric characters and single hyphens"
            });
        }
    }

    if (body.level !== undefined && body.level !== "") {
        if (!ALLOWED_LEVELS.includes(body.level)) {
            errors.push({
                field: "level",
                message: `Level must be one of: ${ALLOWED_LEVELS.join(", ")}`
            });
        }
    }

    return errors;
};

export const validateCourseIdParam = (req) => {
    const errors = [];
    const { courseId } = req.params || {};

    if (!courseId || typeof courseId !== "string" || courseId.trim().length === 0) {
        errors.push({ field: "courseId", message: "Course identifier is required" });
    }

    return errors;
};

export const validateGetAllCourses = (req) => {
    const errors = [];
    const query = req.query || {};

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

    if (query.sortType !== undefined && query.sortType !== "") {
        if (!ALLOWED_SORT_TYPES.includes(String(query.sortType).toLowerCase())) {
            errors.push({
                field: "sortType",
                message: `Sort type must be one of: ${ALLOWED_SORT_TYPES.join(", ")}`
            });
        }
    } else {
        req.query.sortType = "desc";
    }

    if (query.level !== undefined && query.level !== "") {
        if (!ALLOWED_LEVELS.includes(query.level)) {
            errors.push({
                field: "level",
                message: `Level must be one of: ${ALLOWED_LEVELS.join(", ")}`
            });
        }
    }

    return errors;
};

export const createCourseValidator = validate(validateCreateCourse);
export const updateCourseValidator = validate(validateUpdateCourse);
export const courseIdValidator = validate(validateCourseIdParam);
export const getAllCoursesValidator = validate(validateGetAllCourses);
