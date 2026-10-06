import { Router } from "express";
import {
    updateChapter,
    deleteChapter
} from "../controllers/chapter.controller.js";
import { createLesson } from "../controllers/lesson.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    updateChapterValidator,
    chapterIdValidator
} from "../validators/chapter.validator.js";
import { createLessonValidator } from "../validators/lesson.validator.js";

const router = Router();

// Chapter lesson sub-resource
router
    .route("/:chapterId/lessons")
    .post(verifyJWT, authorizeRoles("instructor", "admin"), createLessonValidator, createLesson);

// Single chapter management
router
    .route("/:chapterId")
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), updateChapterValidator, updateChapter)
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), chapterIdValidator, deleteChapter);

export default router;
