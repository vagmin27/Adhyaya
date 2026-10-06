import { Router } from "express";
import {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    deactivateSkill,
    getSkillGraph
} from "../controllers/skill.controller.js";
import studentSkillRouter from "./studentSkill.routes.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    createSkillValidator,
    updateSkillValidator,
    skillStatusValidator,
    skillIdValidator
} from "../validators/skill.validator.js";

const router = Router();

// Student-specific skills profile mounted under /me
// MUST be registered before /:skillId to prevent "me" being interpreted as a skillId
router.use("/me", studentSkillRouter);

// Global skill collection routes
router
    .route("/")
    .get(getAllSkills)
    .post(verifyJWT, authorizeRoles("admin"), createSkillValidator, createSkill);

// Bounded skill graph around a skill
router
    .route("/:skillId/graph")
    .get(skillIdValidator, getSkillGraph);

// Safe status toggle (deactivation)
router
    .route("/:skillId/status")
    .patch(verifyJWT, authorizeRoles("admin"), skillStatusValidator, deactivateSkill);

// Single skill routes
router
    .route("/:skillId")
    .get(skillIdValidator, getSkillById)
    .patch(verifyJWT, authorizeRoles("admin"), updateSkillValidator, updateSkill);

export default router;
