import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

const ALLOWED_LESSON_TYPES = ["video", "article"];

export const validateCreateLesson = (req) => {
    const errors = [];
    const { chapterId } = req.params || {};
    const body = req.body || {};

    if (!chapterId || !isValidObjectId(chapterId)) {
        errors.push({ field: "chapterId", message: "Valid chapter ID parameter is required" });
    }

    if (typeof body.title === "string") {
        body.title = body.title.trim();
    }

    if (!body.title || typeof body.title !== "string" || body.title.length < 2) {
        errors.push({ field: "title", message: "Lesson title is required and must be at least 2 characters" });
    }

    if (body.type !== undefined && body.type !== "") {
        if (!ALLOWED_LESSON_TYPES.includes(body.type)) {
            errors.push({
                field: "type",
                message: `Lesson type must be one of: ${ALLOWED_LESSON_TYPES.join(", ")}`
            });
        }
    }

    const lessonType = body.type || "video";
    if (lessonType === "video") {
        if (body.videoId !== undefined && body.videoId !== null && body.videoId !== "") {
            if (!isValidObjectId(body.videoId)) {
                errors.push({ field: "videoId", message: "videoId must be a valid ObjectId" });
            }
        }
    }

    if (body.order !== undefined && body.order !== null && body.order !== "") {
        const orderNum = Number(body.order);
        if (!Number.isInteger(orderNum) || orderNum < 1) {
            errors.push({ field: "order", message: "Lesson order must be a positive integer" });
        } else {
            req.body.order = orderNum;
        }
    }

    if (body.duration !== undefined && body.duration !== null && body.duration !== "") {
        const dur = Number(body.duration);
        if (isNaN(dur) || dur < 0) {
            errors.push({ field: "duration", message: "Duration must be a non-negative number of seconds" });
        } else {
            req.body.duration = dur;
        }
    }

    return errors;
};

export const validateUpdateLesson = (req) => {
    const errors = [];
    const { lessonId } = req.params || {};
    const body = req.body || {};

    if (!lessonId || !isValidObjectId(lessonId)) {
        errors.push({ field: "lessonId", message: "Valid lesson ID parameter is required" });
    }

    if (body.title !== undefined) {
        body.title = String(body.title).trim();
        if (body.title.length < 2) {
            errors.push({ field: "title", message: "Lesson title must be at least 2 characters" });
        }
    }

    if (body.type !== undefined && body.type !== "") {
        if (!ALLOWED_LESSON_TYPES.includes(body.type)) {
            errors.push({
                field: "type",
                message: `Lesson type must be one of: ${ALLOWED_LESSON_TYPES.join(", ")}`
            });
        }
    }

    if (body.videoId !== undefined && body.videoId !== null && body.videoId !== "") {
        if (!isValidObjectId(body.videoId)) {
            errors.push({ field: "videoId", message: "videoId must be a valid ObjectId" });
        }
    }

    if (body.order !== undefined && body.order !== null && body.order !== "") {
        const orderNum = Number(body.order);
        if (!Number.isInteger(orderNum) || orderNum < 1) {
            errors.push({ field: "order", message: "Lesson order must be a positive integer" });
        } else {
            req.body.order = orderNum;
        }
    }

    if (body.duration !== undefined && body.duration !== null && body.duration !== "") {
        const dur = Number(body.duration);
        if (isNaN(dur) || dur < 0) {
            errors.push({ field: "duration", message: "Duration must be a non-negative number of seconds" });
        } else {
            req.body.duration = dur;
        }
    }

    return errors;
};

export const validateLessonIdParam = (req) => {
    const errors = [];
    const { lessonId } = req.params || {};

    if (!lessonId || !isValidObjectId(lessonId)) {
        errors.push({ field: "lessonId", message: "Valid lesson ID parameter is required" });
    }

    return errors;
};

export const createLessonValidator = validate(validateCreateLesson);
export const updateLessonValidator = validate(validateUpdateLesson);
export const lessonIdValidator = validate(validateLessonIdParam);
