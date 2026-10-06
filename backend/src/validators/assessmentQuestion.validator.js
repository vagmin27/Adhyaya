import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateCreateQuestion = (req) => {
    const errors = [];
    const { assessmentId } = req.params || {};
    const body = req.body || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }

    if (typeof body.questionText === "string") {
        body.questionText = body.questionText.trim();
    }
    if (!body.questionText || typeof body.questionText !== "string" || body.questionText.length < 3) {
        errors.push({ field: "questionText", message: "Question text is required and must be at least 3 characters" });
    }

    if (!Array.isArray(body.options) || body.options.length < 2) {
        errors.push({ field: "options", message: "Options must be an array with at least 2 choices" });
    } else {
        const hasEmptyOption = body.options.some((opt) => typeof opt !== "string" || opt.trim().length === 0);
        if (hasEmptyOption) {
            errors.push({ field: "options", message: "Each option must be a non-empty string" });
        }
    }

    if (body.correctOption === undefined || body.correctOption === null) {
        errors.push({ field: "correctOption", message: "Correct option index is required" });
    } else {
        const correctIndex = Number(body.correctOption);
        if (!Number.isInteger(correctIndex) || correctIndex < 0) {
            errors.push({ field: "correctOption", message: "Correct option must be a non-negative integer index" });
        } else if (Array.isArray(body.options) && (correctIndex >= body.options.length)) {
            errors.push({
                field: "correctOption",
                message: `Correct option index (${correctIndex}) must be within the bounds of options (0 to ${body.options.length - 1})`
            });
        } else {
            req.body.correctOption = correctIndex;
        }
    }

    if (body.marks !== undefined && body.marks !== null && body.marks !== "") {
        const m = Number(body.marks);
        if (!Number.isInteger(m) || m < 1) {
            errors.push({ field: "marks", message: "Marks must be a positive integer" });
        } else {
            req.body.marks = m;
        }
    }

    if (body.order !== undefined && body.order !== null && body.order !== "") {
        const o = Number(body.order);
        if (!Number.isInteger(o) || o < 1) {
            errors.push({ field: "order", message: "Order must be a positive integer" });
        } else {
            req.body.order = o;
        }
    }

    return errors;
};

export const validateUpdateQuestion = (req) => {
    const errors = [];
    const { assessmentId, questionId } = req.params || {};
    const body = req.body || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }
    if (!questionId || !isValidObjectId(questionId)) {
        errors.push({ field: "questionId", message: "Valid question ID parameter is required" });
    }

    if (body.questionText !== undefined) {
        body.questionText = String(body.questionText).trim();
        if (body.questionText.length < 3) {
            errors.push({ field: "questionText", message: "Question text must be at least 3 characters" });
        }
    }

    if (body.options !== undefined) {
        if (!Array.isArray(body.options) || body.options.length < 2) {
            errors.push({ field: "options", message: "Options must be an array with at least 2 choices" });
        } else {
            const hasEmptyOption = body.options.some((opt) => typeof opt !== "string" || opt.trim().length === 0);
            if (hasEmptyOption) {
                errors.push({ field: "options", message: "Each option must be a non-empty string" });
            }
        }
    }

    if (body.correctOption !== undefined && body.correctOption !== null) {
        const correctIndex = Number(body.correctOption);
        if (!Number.isInteger(correctIndex) || correctIndex < 0) {
            errors.push({ field: "correctOption", message: "Correct option must be a non-negative integer index" });
        } else if (Array.isArray(body.options) && (correctIndex >= body.options.length)) {
            errors.push({
                field: "correctOption",
                message: `Correct option index (${correctIndex}) must be within the bounds of options (0 to ${body.options.length - 1})`
            });
        } else {
            req.body.correctOption = correctIndex;
        }
    }

    if (body.marks !== undefined && body.marks !== null && body.marks !== "") {
        const m = Number(body.marks);
        if (!Number.isInteger(m) || m < 1) {
            errors.push({ field: "marks", message: "Marks must be a positive integer" });
        } else {
            req.body.marks = m;
        }
    }

    if (body.order !== undefined && body.order !== null && body.order !== "") {
        const o = Number(body.order);
        if (!Number.isInteger(o) || o < 1) {
            errors.push({ field: "order", message: "Order must be a positive integer" });
        } else {
            req.body.order = o;
        }
    }

    return errors;
};

export const validateQuestionIdParams = (req) => {
    const errors = [];
    const { assessmentId, questionId } = req.params || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }
    if (!questionId || !isValidObjectId(questionId)) {
        errors.push({ field: "questionId", message: "Valid question ID parameter is required" });
    }

    return errors;
};

export const validateReorderQuestions = (req) => {
    const errors = [];
    const { assessmentId } = req.params || {};
    const body = req.body || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }

    if (!Array.isArray(body.orders) || body.orders.length === 0) {
        errors.push({ field: "orders", message: "orders array is required" });
    } else {
        body.orders.forEach((item, index) => {
            if (!item.questionId || !isValidObjectId(item.questionId)) {
                errors.push({ field: `orders[${index}].questionId`, message: "Valid questionId is required" });
            }
            if (item.order === undefined || !Number.isInteger(Number(item.order)) || Number(item.order) < 1) {
                errors.push({ field: `orders[${index}].order`, message: "Order must be a positive integer" });
            }
        });
    }

    return errors;
};

export const createQuestionValidator = validate(validateCreateQuestion);
export const updateQuestionValidator = validate(validateUpdateQuestion);
export const questionIdParamsValidator = validate(validateQuestionIdParams);
export const reorderQuestionsValidator = validate(validateReorderQuestions);
