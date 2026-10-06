import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

/**
 * Validate skill creation
 */
export const validateCreateSkill = (req) => {
    const errors = [];
    const body = req.body || {};

    if (typeof body.name === "string") {
        body.name = body.name.trim();
    }
    if (!body.name || typeof body.name !== "string" || body.name.length < 2) {
        errors.push({ field: "name", message: "Skill name is required and must be at least 2 characters" });
    }

    if (body.slug !== undefined && body.slug !== null && body.slug !== "") {
        if (typeof body.slug === "string") {
            body.slug = body.slug.trim().toLowerCase();
        }
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(body.slug)) {
            errors.push({ field: "slug", message: "Slug must be lowercase alphanumeric characters separated by hyphens" });
        }
    }

    if (body.description !== undefined && body.description !== null) {
        if (typeof body.description === "string") {
            body.description = body.description.trim();
        }
        if (body.description.length > 1000) {
            errors.push({ field: "description", message: "Description cannot exceed 1000 characters" });
        }
    }

    if (body.category !== undefined && body.category !== null) {
        if (typeof body.category === "string") {
            body.category = body.category.trim();
        }
    }

    if (body.difficulty !== undefined && body.difficulty !== null && body.difficulty !== "") {
        if (!VALID_DIFFICULTIES.includes(body.difficulty)) {
            errors.push({
                field: "difficulty",
                message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`
            });
        }
    }

    if (body.parentSkill !== undefined && body.parentSkill !== null && body.parentSkill !== "") {
        if (!isValidObjectId(body.parentSkill)) {
            errors.push({ field: "parentSkill", message: "parentSkill must be a valid ObjectId" });
        }
    }

    if (body.prerequisites !== undefined && body.prerequisites !== null) {
        if (!Array.isArray(body.prerequisites)) {
            errors.push({ field: "prerequisites", message: "prerequisites must be an array of Skill IDs" });
        } else {
            for (let i = 0; i < body.prerequisites.length; i++) {
                const prereq = body.prerequisites[i];
                if (!isValidObjectId(prereq)) {
                    errors.push({
                        field: `prerequisites[${i}]`,
                        message: "Each prerequisite must be a valid ObjectId"
                    });
                }
            }
        }
    }

    if (body.relatedSkills !== undefined && body.relatedSkills !== null) {
        if (!Array.isArray(body.relatedSkills)) {
            errors.push({ field: "relatedSkills", message: "relatedSkills must be an array of Skill IDs" });
        } else {
            for (let i = 0; i < body.relatedSkills.length; i++) {
                const rel = body.relatedSkills[i];
                if (!isValidObjectId(rel)) {
                    errors.push({
                        field: `relatedSkills[${i}]`,
                        message: "Each related skill must be a valid ObjectId"
                    });
                }
            }
        }
    }

    return errors;
};

/**
 * Validate skill update
 */
export const validateUpdateSkill = (req) => {
    const errors = [];
    const { skillId } = req.params || {};
    const body = req.body || {};

    if (!skillId || !isValidObjectId(skillId)) {
        errors.push({ field: "skillId", message: "Valid skill ID parameter is required" });
    }

    if (body.name !== undefined) {
        if (typeof body.name === "string") {
            body.name = body.name.trim();
        }
        if (!body.name || typeof body.name !== "string" || body.name.length < 2) {
            errors.push({ field: "name", message: "Skill name must be at least 2 characters" });
        }
    }

    if (body.slug !== undefined) {
        if (typeof body.slug === "string") {
            body.slug = body.slug.trim().toLowerCase();
        }
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(body.slug)) {
            errors.push({ field: "slug", message: "Slug must be lowercase alphanumeric characters separated by hyphens" });
        }
    }

    if (body.description !== undefined && body.description !== null) {
        if (typeof body.description === "string") {
            body.description = body.description.trim();
        }
        if (body.description.length > 1000) {
            errors.push({ field: "description", message: "Description cannot exceed 1000 characters" });
        }
    }

    if (body.difficulty !== undefined && body.difficulty !== null && body.difficulty !== "") {
        if (!VALID_DIFFICULTIES.includes(body.difficulty)) {
            errors.push({
                field: "difficulty",
                message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`
            });
        }
    }

    if (body.parentSkill !== undefined && body.parentSkill !== null && body.parentSkill !== "") {
        if (!isValidObjectId(body.parentSkill)) {
            errors.push({ field: "parentSkill", message: "parentSkill must be a valid ObjectId" });
        } else if (skillId && body.parentSkill.toString() === skillId.toString()) {
            errors.push({ field: "parentSkill", message: "A skill cannot be its own parent" });
        }
    }

    if (body.prerequisites !== undefined && body.prerequisites !== null) {
        if (!Array.isArray(body.prerequisites)) {
            errors.push({ field: "prerequisites", message: "prerequisites must be an array of Skill IDs" });
        } else {
            for (let i = 0; i < body.prerequisites.length; i++) {
                const prereq = body.prerequisites[i];
                if (!isValidObjectId(prereq)) {
                    errors.push({
                        field: `prerequisites[${i}]`,
                        message: "Each prerequisite must be a valid ObjectId"
                    });
                } else if (skillId && prereq.toString() === skillId.toString()) {
                    errors.push({
                        field: `prerequisites[${i}]`,
                        message: "A skill cannot be a prerequisite of itself"
                    });
                }
            }
        }
    }

    if (body.relatedSkills !== undefined && body.relatedSkills !== null) {
        if (!Array.isArray(body.relatedSkills)) {
            errors.push({ field: "relatedSkills", message: "relatedSkills must be an array of Skill IDs" });
        } else {
            for (let i = 0; i < body.relatedSkills.length; i++) {
                const rel = body.relatedSkills[i];
                if (!isValidObjectId(rel)) {
                    errors.push({
                        field: `relatedSkills[${i}]`,
                        message: "Each related skill must be a valid ObjectId"
                    });
                } else if (skillId && rel.toString() === skillId.toString()) {
                    errors.push({
                        field: `relatedSkills[${i}]`,
                        message: "A skill cannot be related to itself"
                    });
                }
            }
        }
    }

    return errors;
};

/**
 * Validate skill status toggle
 */
export const validateSkillStatus = (req) => {
    const errors = [];
    const { skillId } = req.params || {};
    const body = req.body || {};

    if (!skillId || !isValidObjectId(skillId)) {
        errors.push({ field: "skillId", message: "Valid skill ID parameter is required" });
    }

    if (body.isActive === undefined || typeof body.isActive !== "boolean") {
        errors.push({ field: "isActive", message: "isActive must be a boolean" });
    }

    return errors;
};

/**
 * Validate skillId parameter
 */
export const validateSkillIdParam = (req) => {
    const errors = [];
    const { skillId } = req.params || {};

    if (!skillId || !isValidObjectId(skillId)) {
        errors.push({ field: "skillId", message: "Valid skill ID parameter is required" });
    }

    return errors;
};

/**
 * Validate CourseSkill mapping
 */
export const validateCourseSkillMapping = (req) => {
    const errors = [];
    const { courseId } = req.params || {};
    const body = req.body || {};

    if (!courseId || !isValidObjectId(courseId)) {
        errors.push({ field: "courseId", message: "Valid course ID parameter is required" });
    }

    if (!body.skillId || !isValidObjectId(body.skillId)) {
        errors.push({ field: "skillId", message: "Valid skill ID is required in body" });
    }

    if (body.importance !== undefined && body.importance !== null) {
        const imp = Number(body.importance);
        if (![1, 2, 3].includes(imp)) {
            errors.push({ field: "importance", message: "Importance must be 1 (supporting), 2 (important), or 3 (core)" });
        } else {
            req.body.importance = imp;
        }
    }

    if (body.targetLevel !== undefined && body.targetLevel !== null && body.targetLevel !== "") {
        if (!VALID_DIFFICULTIES.includes(body.targetLevel)) {
            errors.push({ field: "targetLevel", message: `targetLevel must be one of: ${VALID_DIFFICULTIES.join(", ")}` });
        }
    }

    return errors;
};

/**
 * Validate LessonSkill mapping
 */
export const validateLessonSkillMapping = (req) => {
    const errors = [];
    const { lessonId } = req.params || {};
    const body = req.body || {};

    if (!lessonId || !isValidObjectId(lessonId)) {
        errors.push({ field: "lessonId", message: "Valid lesson ID parameter is required" });
    }

    if (!body.skillId || !isValidObjectId(body.skillId)) {
        errors.push({ field: "skillId", message: "Valid skill ID is required in body" });
    }

    if (body.contributionWeight !== undefined && body.contributionWeight !== null) {
        const weight = Number(body.contributionWeight);
        if (isNaN(weight) || weight <= 0) {
            errors.push({ field: "contributionWeight", message: "Contribution weight must be a positive number" });
        } else {
            req.body.contributionWeight = weight;
        }
    }

    return errors;
};

/**
 * Validate AssessmentSkill mapping
 */
export const validateAssessmentSkillMapping = (req) => {
    const errors = [];
    const { assessmentId } = req.params || {};
    const body = req.body || {};

    if (!assessmentId || !isValidObjectId(assessmentId)) {
        errors.push({ field: "assessmentId", message: "Valid assessment ID parameter is required" });
    }

    if (!body.skillId || !isValidObjectId(body.skillId)) {
        errors.push({ field: "skillId", message: "Valid skill ID is required in body" });
    }

    if (body.weight !== undefined && body.weight !== null) {
        const weight = Number(body.weight);
        if (isNaN(weight) || weight <= 0) {
            errors.push({ field: "weight", message: "Weight must be a positive number" });
        } else {
            req.body.weight = weight;
        }
    }

    return errors;
};

export const createSkillValidator = validate(validateCreateSkill);
export const updateSkillValidator = validate(validateUpdateSkill);
export const skillStatusValidator = validate(validateSkillStatus);
export const skillIdValidator = validate(validateSkillIdParam);
export const courseSkillMappingValidator = validate(validateCourseSkillMapping);
export const lessonSkillMappingValidator = validate(validateLessonSkillMapping);
export const assessmentSkillMappingValidator = validate(validateAssessmentSkillMapping);
