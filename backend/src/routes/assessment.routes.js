import { Router } from "express";
import {
    createAssessment,
    deleteAssessment,
    getAssessmentById,
    getCourseAssessments,
    toggleAssessmentPublish,
    updateAssessment
} from "../controllers/assessment.controller.js";
import {
    createQuestion,
    deleteQuestion,
    reorderQuestions,
    updateQuestion
} from "../controllers/assessmentQuestion.controller.js";
import {
    startAssessmentAttempt,
    getAssessmentAttemptsHistory
} from "../controllers/assessmentAttempt.controller.js";
import {
    createAssessmentSkill,
    getAssessmentSkills,
    deleteAssessmentSkill
} from "../controllers/skill.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    createAssessmentValidator,
    updateAssessmentValidator,
    assessmentIdValidator,
    assessmentCourseIdValidator
} from "../validators/assessment.validator.js";
import {
    createQuestionValidator,
    updateQuestionValidator,
    questionIdParamsValidator,
    reorderQuestionsValidator
} from "../validators/assessmentQuestion.validator.js";
import { assessmentSkillMappingValidator } from "../validators/skill.validator.js";

const router = Router();

// Assessment collection routes
router
    .route("/")
    .post(verifyJWT, authorizeRoles("instructor", "admin"), createAssessmentValidator, createAssessment);

// List assessments for a course
router
    .route("/course/:courseId")
    .get(optionalAuth, assessmentCourseIdValidator, getCourseAssessments);

// Student attempts endpoints nested under assessment
router
    .route("/:assessmentId/attempts")
    .post(verifyJWT, assessmentIdValidator, startAssessmentAttempt);

router
    .route("/:assessmentId/attempts/me")
    .get(verifyJWT, assessmentIdValidator, getAssessmentAttemptsHistory);

// Assessment skills sub-resource routes
router
    .route("/:assessmentId/skills")
    .get(optionalAuth, assessmentIdValidator, getAssessmentSkills)
    .post(verifyJWT, authorizeRoles("instructor", "admin"), assessmentSkillMappingValidator, createAssessmentSkill);

router
    .route("/:assessmentId/skills/:skillId")
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), deleteAssessmentSkill);

// Question sub-resource routes
router
    .route("/:assessmentId/questions/reorder")
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), reorderQuestionsValidator, reorderQuestions);

router
    .route("/:assessmentId/questions")
    .post(verifyJWT, authorizeRoles("instructor", "admin"), createQuestionValidator, createQuestion);

router
    .route("/:assessmentId/questions/:questionId")
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), updateQuestionValidator, updateQuestion)
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), questionIdParamsValidator, deleteQuestion);

// Publish toggle
router
    .route("/:assessmentId/publish")
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), assessmentIdValidator, toggleAssessmentPublish);

// Single assessment item routes
router
    .route("/:assessmentId")
    .get(optionalAuth, assessmentIdValidator, getAssessmentById)
    .patch(verifyJWT, authorizeRoles("instructor", "admin"), updateAssessmentValidator, updateAssessment)
    .delete(verifyJWT, authorizeRoles("instructor", "admin"), assessmentIdValidator, deleteAssessment);

export default router;
