import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateUpdateLessonProgress = (req) => {
    const errors = [];
    const { lessonId } = req.params || {};
    const body = req.body || {};

    if (!lessonId || !isValidObjectId(lessonId)) {
        errors.push({ field: "lessonId", message: "Valid lesson ID parameter is required" });
    }

    if (body.secondsWatched !== undefined && body.secondsWatched !== null && body.secondsWatched !== "") {
        const secs = Number(body.secondsWatched);
        if (isNaN(secs) || secs < 0) {
            errors.push({ field: "secondsWatched", message: "secondsWatched must be a non-negative number" });
        } else {
            req.body.secondsWatched = secs;
        }
    }

    if (body.lastPositionSeconds !== undefined && body.lastPositionSeconds !== null && body.lastPositionSeconds !== "") {
        const pos = Number(body.lastPositionSeconds);
        if (isNaN(pos) || pos < 0) {
            errors.push({ field: "lastPositionSeconds", message: "lastPositionSeconds must be a non-negative number" });
        } else {
            req.body.lastPositionSeconds = pos;
        }
    }

    if (body.isCompleted !== undefined && typeof body.isCompleted !== "boolean") {
        errors.push({ field: "isCompleted", message: "isCompleted must be a boolean" });
    }

    return errors;
};

export const validateCourseProgressParam = (req) => {
    const errors = [];
    const { courseId } = req.params || {};

    if (!courseId || !isValidObjectId(courseId)) {
        errors.push({ field: "courseId", message: "Valid course ID parameter is required" });
    }

    return errors;
};

export const updateLessonProgressValidator = validate(validateUpdateLessonProgress);
export const courseProgressParamValidator = validate(validateCourseProgressParam);
