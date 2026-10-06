import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateCreateChapter = (req) => {
    const errors = [];
    const { courseId } = req.params || {};
    const body = req.body || {};

    if (!courseId || !isValidObjectId(courseId)) {
        errors.push({ field: "courseId", message: "Valid course ID parameter is required" });
    }

    if (typeof body.title === "string") {
        body.title = body.title.trim();
    }

    if (!body.title || typeof body.title !== "string" || body.title.length < 2) {
        errors.push({ field: "title", message: "Chapter title is required and must be at least 2 characters" });
    }

    if (body.order !== undefined && body.order !== null && body.order !== "") {
        const orderNum = Number(body.order);
        if (!Number.isInteger(orderNum) || orderNum < 1) {
            errors.push({ field: "order", message: "Chapter order must be a positive integer" });
        } else {
            req.body.order = orderNum;
        }
    }

    return errors;
};

export const validateUpdateChapter = (req) => {
    const errors = [];
    const { chapterId } = req.params || {};
    const body = req.body || {};

    if (!chapterId || !isValidObjectId(chapterId)) {
        errors.push({ field: "chapterId", message: "Valid chapter ID parameter is required" });
    }

    if (body.title !== undefined) {
        body.title = String(body.title).trim();
        if (body.title.length < 2) {
            errors.push({ field: "title", message: "Chapter title must be at least 2 characters" });
        }
    }

    if (body.order !== undefined && body.order !== null && body.order !== "") {
        const orderNum = Number(body.order);
        if (!Number.isInteger(orderNum) || orderNum < 1) {
            errors.push({ field: "order", message: "Chapter order must be a positive integer" });
        } else {
            req.body.order = orderNum;
        }
    }

    return errors;
};

export const validateChapterIdParam = (req) => {
    const errors = [];
    const { chapterId } = req.params || {};

    if (!chapterId || !isValidObjectId(chapterId)) {
        errors.push({ field: "chapterId", message: "Valid chapter ID parameter is required" });
    }

    return errors;
};

export const createChapterValidator = validate(validateCreateChapter);
export const updateChapterValidator = validate(validateUpdateChapter);
export const chapterIdValidator = validate(validateChapterIdParam);
