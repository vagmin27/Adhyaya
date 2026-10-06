import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

export const validateAttemptIdParam = (req) => {
    const errors = [];
    const { attemptId } = req.params || {};

    if (!attemptId || !isValidObjectId(attemptId)) {
        errors.push({ field: "attemptId", message: "Valid attempt ID parameter is required" });
    }

    return errors;
};

export const validateSubmitAnswers = (req) => {
    const errors = [];
    const { attemptId } = req.params || {};
    const body = req.body || {};

    if (!attemptId || !isValidObjectId(attemptId)) {
        errors.push({ field: "attemptId", message: "Valid attempt ID parameter is required" });
    }

    if (!Array.isArray(body.answers)) {
        errors.push({ field: "answers", message: "Answers must be an array" });
    } else {
        body.answers.forEach((ans, idx) => {
            if (!ans.questionId || !isValidObjectId(ans.questionId)) {
                errors.push({ field: `answers[${idx}].questionId`, message: "Valid questionId is required" });
            }
            if (ans.selectedOption !== undefined && ans.selectedOption !== null) {
                const opt = Number(ans.selectedOption);
                if (!Number.isInteger(opt) || opt < 0) {
                    errors.push({ field: `answers[${idx}].selectedOption`, message: "selectedOption must be a non-negative integer or null" });
                }
            }
        });
    }

    return errors;
};

export const attemptIdValidator = validate(validateAttemptIdParam);
export const submitAnswersValidator = validate(validateSubmitAnswers);
