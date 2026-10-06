import { Router } from "express";
import {
    deleteLesson,
    getLessonById,
    updateLesson
} from "../controllers/lesson.controller.js";
import {
    createLessonSkill,
    getLessonSkills,
    deleteLessonSkill
} from "../controllers/skill.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    lessonIdValidator,
    updateLessonValidator
} from "../validators/lesson.validator.js";
import { lessonSkillMappingValidator } from "../validators/skill.validator.js";

const router = Router();

// Lesson skills sub-resource routes
router
    .route("/:lessonId/skills")
    .get(optionalAuth, lessonIdValidator, getLessonSkills)
    .post(verifyJWT, authorizeRoles("instructor", "admin"), lessonSkillMappingValidator, createLessonSkill);

router
    .route("/:lessonId/skills/:skillId")
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), deleteLessonSkill);

router
    .route("/:lessonId")
    .get(optionalAuth, lessonIdValidator, getLessonById)
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), updateLessonValidator, updateLesson)
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), lessonIdValidator, deleteLesson);

export default router;
