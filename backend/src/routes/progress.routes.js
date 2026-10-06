import { Router } from "express";
import {
    updateLessonProgress,
    getCourseProgress,
    getContinueLearning
} from "../controllers/progress.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    updateLessonProgressValidator,
    courseProgressParamValidator
} from "../validators/progress.validator.js";

const router = Router();

// All progress routes require authentication
router.use(verifyJWT);

// Continue learning items
router.route("/continue-learning").get(getContinueLearning);

// Lesson progress update
router.route("/lessons/:lessonId").post(updateLessonProgressValidator, updateLessonProgress);

// Course-wide progress breakdown
router.route("/courses/:courseId").get(courseProgressParamValidator, getCourseProgress);

export default router;
