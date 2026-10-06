import { Router } from "express";
import {
    getActiveAttempt,
    getAttemptResult,
    submitAssessmentAnswers
} from "../controllers/assessmentAttempt.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    attemptIdValidator,
    submitAnswersValidator
} from "../validators/assessmentAttempt.validator.js";

const router = Router();

// All assessment attempt routes require authentication
router.use(verifyJWT);

// Submit answers for grading
router
    .route("/:attemptId/submit")
    .post(submitAnswersValidator, submitAssessmentAnswers);

// View attempt result
router
    .route("/:attemptId/result")
    .get(attemptIdValidator, getAttemptResult);

// Get active attempt (active test environment)
router
    .route("/:attemptId")
    .get(attemptIdValidator, getActiveAttempt);

export default router;
