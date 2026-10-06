import { Router } from "express";
import {
    getMySkills,
    getMySkillDetails
} from "../controllers/studentSkill.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { skillIdValidator } from "../validators/skill.validator.js";

const router = Router();

// All student skill routes require authentication and strictly use req.user._id
router.use(verifyJWT);

// GET /api/v1/skills/me
router.route("/").get(getMySkills);

// GET /api/v1/skills/me/:skillId
router.route("/:skillId").get(skillIdValidator, getMySkillDetails);

export default router;
