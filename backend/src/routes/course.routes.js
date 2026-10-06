import { Router } from "express";
import {
    createCourse,
    deleteCourse,
    getAllCourses,
    getCourseById,
    toggleCoursePublish,
    updateCourse
} from "../controllers/course.controller.js";
import {
    createChapter,
    getCourseChapters
} from "../controllers/chapter.controller.js";
import { getCourseAssessmentsSummary } from "../controllers/assessmentAttempt.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    createCourseSkill,
    getCourseSkills,
    deleteCourseSkill
} from "../controllers/skill.controller.js";
import {
    createCourseValidator,
    updateCourseValidator,
    courseIdValidator,
    getAllCoursesValidator
} from "../validators/course.validator.js";
import { createChapterValidator } from "../validators/chapter.validator.js";
import { courseSkillMappingValidator } from "../validators/skill.validator.js";

const router = Router();

// Course collection routes
router
    .route("/")
    .get(optionalAuth, getAllCoursesValidator, getAllCourses)
    .post(verifyJWT, authorizeRoles("instructor", "admin"), createCourseValidator, createCourse);

// Course chapter sub-resource routes
router
    .route("/:courseId/chapters")
    .get(optionalAuth, courseIdValidator, getCourseChapters)
    .post(verifyJWT, authorizeRoles("instructor", "admin"), createChapterValidator, createChapter);

// Course assessments summary for enrolled students
router
    .route("/:courseId/assessments")
    .get(verifyJWT, courseIdValidator, getCourseAssessmentsSummary);

// Course skills sub-resource routes
router
    .route("/:courseId/skills")
    .get(optionalAuth, courseIdValidator, getCourseSkills)
    .post(verifyJWT, authorizeRoles("instructor", "admin"), courseSkillMappingValidator, createCourseSkill);

router
    .route("/:courseId/skills/:skillId")
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), deleteCourseSkill);

// Course publish status toggle
router
    .route("/:courseId/publish")
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), courseIdValidator, toggleCoursePublish);

// Single course item routes
router
    .route("/:courseId")
    .get(optionalAuth, courseIdValidator, getCourseById)
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), updateCourseValidator, updateCourse)
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), courseIdValidator, deleteCourse);

export default router;
