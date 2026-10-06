import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateCreateAssessment = (req) => {
    const errors = [];
    const body = req.body || {};

    if (!body.courseId || !isValidObjectId(body.courseId)) {
        errors.push({ field: "courseId", message: "Valid course ID is required" });
    }

    if (body.chapterId !== undefined && body.chapterId !== null && body.chapterId !== "") {
        if (!isValidObjectId(body.chapterId)) {
            errors.push({ field: "chapterId", message: "chapterId must be a valid ObjectId" });
        }
    }

    if (typeof body.title === "string") {
        body.title = body.title.trim();
    }
    if (!body.title || typeof body.title !== "string" || body.title.length < 3) {
        errors.push({ field: "title", message: "Assessment title is required and must be at least 3 characters" });
    }

    if (body.passingPercentage !== undefined && body.passingPercentage !== null && body.passingPercentage !== "") {
        const passing = Number(body.passingPercentage);
        if (isNaN(passing) || passing < 0 || passing > 100) {
            errors.push({ field: "passingPercentage", message: "Passing percentage must be a number between 0 and 100" });
        } else {
            req.body.passingPercentage = passing;
        }
    }

    if (body.timeLimitMinutes !== undefined && body.timeLimitMinutes !== null && body.timeLimitMinutes !== "") {
        const timeLimit = Number(body.timeLimitMinutes);
        if (!Number.isInteger(timeLimit) || timeLimit < 1) {
            errors.push({ field: "timeLimitMinutes", message: "Time limit must be an integer of at least 1 minute" });
        } else {
            req.body.timeLimitMinutes = timeLimit;
        }
    }

    if (body.maxAttempts !== undefined && body.maxAttempts !== null && body.maxAttempts !== "") {
        const maxAtt = Number(body.maxAttempts);
        if (!Number.isInteger(maxAtt) || maxAtt < 1) {
            errors.push({ field: "maxAttempts", message: "Max attempts must be an integer of at least 1" });
        } else {
            req.body.maxAttempts = maxAtt;
        }
    }

    return errors;
};

export const validateUpdateAssessment = (req) => {
    const errors = [];
    const { assessmentId } = req.params || {};
    const body = req.body || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }

    if (body.chapterId !== undefined && body.chapterId !== null && body.chapterId !== "") {
        if (!isValidObjectId(body.chapterId)) {
            errors.push({ field: "chapterId", message: "chapterId must be a valid ObjectId" });
        }
    }

    if (body.title !== undefined) {
        body.title = String(body.title).trim();
        if (body.title.length < 3) {
            errors.push({ field: "title", message: "Assessment title must be at least 3 characters" });
        }
    }

    if (body.passingPercentage !== undefined && body.passingPercentage !== null && body.passingPercentage !== "") {
        const passing = Number(body.passingPercentage);
        if (isNaN(passing) || passing < 0 || passing > 100) {
            errors.push({ field: "passingPercentage", message: "Passing percentage must be a number between 0 and 100" });
        } else {
            req.body.passingPercentage = passing;
        }
    }

    if (body.timeLimitMinutes !== undefined && body.timeLimitMinutes !== null && body.timeLimitMinutes !== "") {
        const timeLimit = Number(body.timeLimitMinutes);
        if (!Number.isInteger(timeLimit) || timeLimit < 1) {
            errors.push({ field: "timeLimitMinutes", message: "Time limit must be an integer of at least 1 minute" });
        } else {
            req.body.timeLimitMinutes = timeLimit;
        }
    }

    if (body.maxAttempts !== undefined && body.maxAttempts !== null && body.maxAttempts !== "") {
        const maxAtt = Number(body.maxAttempts);
        if (!Number.isInteger(maxAtt) || maxAtt < 1) {
            errors.push({ field: "maxAttempts", message: "Max attempts must be an integer of at least 1" });
        } else {
            req.body.maxAttempts = maxAtt;
        }
    }

    return errors;
};

export const validateAssessmentIdParam = (req) => {
    const errors = [];
    const { assessmentId } = req.params || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }

    return errors;
};

export const validateCourseIdParam = (req) => {
    const errors = [];
    const { courseId } = req.params || {};

    if (!courseId || !isValidObjectId(courseId)) {
        errors.push({ field: "courseId", message: "Valid course ID parameter is required" });
    }

    return errors;
};

export const createAssessmentValidator = validate(validateCreateAssessment);
export const updateAssessmentValidator = validate(validateUpdateAssessment);
export const assessmentIdValidator = validate(validateAssessmentIdParam);
export const assessmentCourseIdValidator = validate(validateCourseIdParam);
