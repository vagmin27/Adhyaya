import { isValidObjectId } from "mongoose";
import { Skill } from "../models/skill.model.js";
import { Course } from "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { Assessment } from "../models/assessment.model.js";
import { CourseSkill } from "../models/courseSkill.model.js";
import { LessonSkill } from "../models/lessonSkill.model.js";
import { AssessmentSkill } from "../models/assessmentSkill.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Helper to slugify a skill name
 */
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
};

// ==========================================
// 1. GLOBAL SKILL MANAGEMENT (Admin / Public)
// ==========================================

/**
 * Admin: Create a new platform skill
 */
export const createSkill = asyncHandler(async (req, res) => {
    const {
        name,
        slug: userSlug,
        description = "",
        category = "General",
        parentSkill = null,
        prerequisites = [],
        relatedSkills = [],
        difficulty = "intermediate"
    } = req.body;

    const generatedSlug = userSlug ? slugify(userSlug) : slugify(name);

    if (!generatedSlug) {
        throw new ApiError(400, "Unable to generate a valid slug from skill name");
    }

    // Check slug uniqueness
    const existingSlug = await Skill.findOne({ slug: generatedSlug });
    if (existingSlug) {
        throw new ApiError(409, `Skill with slug '${generatedSlug}' already exists`);
    }

    // Validate relationships if specified
    if (parentSkill) {
        const parent = await Skill.findById(parentSkill);
        if (!parent) {
            throw new ApiError(400, "Referenced parentSkill does not exist");
        }
    }

    if (prerequisites && prerequisites.length > 0) {
        const prereqCount = await Skill.countDocuments({ _id: { $in: prerequisites } });
        if (prereqCount !== prerequisites.length) {
            throw new ApiError(400, "One or more prerequisites do not exist");
        }
    }

    if (relatedSkills && relatedSkills.length > 0) {
        const relCount = await Skill.countDocuments({ _id: { $in: relatedSkills } });
        if (relCount !== relatedSkills.length) {
            throw new ApiError(400, "One or more relatedSkills do not exist");
        }
    }

    const skill = await Skill.create({
        name,
        slug: generatedSlug,
        description,
        category,
        parentSkill: parentSkill || null,
        prerequisites,
        relatedSkills,
        difficulty,
        isActive: true
    });

    return res.status(201).json(
        new ApiResponse(201, skill, "Skill created successfully")
    );
});

/**
 * Public: List platform skills with pagination and filters
 */
export const getAllSkills = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, category, difficulty, isActive } = req.query;

    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    if (category) {
        filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    if (difficulty) {
        filter.difficulty = difficulty.toLowerCase();
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    } else {
        // By default show active skills for public access
        filter.isActive = true;
    }

    const [skills, total] = await Promise.all([
        Skill.find(filter)
            .populate("parentSkill", "name slug category")
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Skill.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                skills,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            "Skills retrieved successfully"
        )
    );
});

/**
 * Public: Get single skill details with bounded population
 */
export const getSkillById = asyncHandler(async (req, res) => {
    const { skillId } = req.params;

    const skill = await Skill.findById(skillId)
        .populate("parentSkill", "name slug category difficulty")
        .populate("prerequisites", "name slug category difficulty")
        .populate("relatedSkills", "name slug category difficulty")
        .lean();

    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    return res.status(200).json(
        new ApiResponse(200, skill, "Skill retrieved successfully")
    );
});

/**
 * Admin: Update skill
 */
export const updateSkill = asyncHandler(async (req, res) => {
    const { skillId } = req.params;
    const {
        name,
        slug: userSlug,
        description,
        category,
        parentSkill,
        prerequisites,
        relatedSkills,
        difficulty
    } = req.body;

    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    // Slug check if updating
    if (userSlug || (name && name !== skill.name)) {
        const newSlug = userSlug ? slugify(userSlug) : slugify(name);
        if (newSlug !== skill.slug) {
            const existingSlug = await Skill.findOne({ slug: newSlug, _id: { $ne: skillId } });
            if (existingSlug) {
                throw new ApiError(409, `Skill with slug '${newSlug}' already exists`);
            }
            skill.slug = newSlug;
        }
    }

    if (name !== undefined) skill.name = name;
    if (description !== undefined) skill.description = description;
    if (category !== undefined) skill.category = category;
    if (difficulty !== undefined) skill.difficulty = difficulty;

    // Self-parent check
    if (parentSkill !== undefined) {
        if (parentSkill) {
            if (parentSkill.toString() === skillId.toString()) {
                throw new ApiError(400, "A skill cannot be its own parent");
            }
            const parentExists = await Skill.findById(parentSkill);
            if (!parentExists) {
                throw new ApiError(400, "Referenced parentSkill does not exist");
            }
            skill.parentSkill = parentSkill;
        } else {
            skill.parentSkill = null;
        }
    }

    // Prerequisites validation and cyclic check
    if (prerequisites !== undefined) {
        if (prerequisites.some((p) => p.toString() === skillId.toString())) {
            throw new ApiError(400, "A skill cannot be a prerequisite of itself");
        }

        if (prerequisites.length > 0) {
            const prereqCount = await Skill.countDocuments({ _id: { $in: prerequisites } });
            if (prereqCount !== prerequisites.length) {
                throw new ApiError(400, "One or more prerequisites do not exist");
            }

            // Check direct cyclic relationship (Skill A cannot be prerequisite of B if B is prerequisite of A)
            const cyclicPrereq = await Skill.findOne({
                _id: { $in: prerequisites },
                prerequisites: skillId
            });
            if (cyclicPrereq) {
                throw new ApiError(400, `Cyclic prerequisite detected: '${cyclicPrereq.name}' already has this skill as a prerequisite`);
            }
        }

        skill.prerequisites = prerequisites;
    }

    // Related skills validation
    if (relatedSkills !== undefined) {
        if (relatedSkills.some((r) => r.toString() === skillId.toString())) {
            throw new ApiError(400, "A skill cannot be related to itself");
        }

        if (relatedSkills.length > 0) {
            const relCount = await Skill.countDocuments({ _id: { $in: relatedSkills } });
            if (relCount !== relatedSkills.length) {
                throw new ApiError(400, "One or more relatedSkills do not exist");
            }
        }

        skill.relatedSkills = relatedSkills;
    }

    await skill.save();

    return res.status(200).json(
        new ApiResponse(200, skill, "Skill updated successfully")
    );
});

/**
 * Admin: Safe deactivation of a platform skill
 */
export const deactivateSkill = asyncHandler(async (req, res) => {
    const { skillId } = req.params;
    const { isActive } = req.body;

    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    skill.isActive = Boolean(isActive);
    await skill.save();

    return res.status(200).json(
        new ApiResponse(200, skill, `Skill ${skill.isActive ? "activated" : "deactivated"} successfully`)
    );
});

/**
 * Public: Bounded skill graph around a skill
 */
export const getSkillGraph = asyncHandler(async (req, res) => {
    const { skillId } = req.params;
    const depth = Math.min(2, Math.max(1, parseInt(req.query.depth, 10) || 1));

    const rootSkill = await Skill.findById(skillId)
        .populate("parentSkill", "name slug category difficulty")
        .populate("prerequisites", "name slug category difficulty")
        .populate("relatedSkills", "name slug category difficulty")
        .lean();

    if (!rootSkill) {
        throw new ApiError(404, "Skill not found");
    }

    const graph = {
        skill: {
            _id: rootSkill._id,
            name: rootSkill.name,
            slug: rootSkill.slug,
            category: rootSkill.category,
            difficulty: rootSkill.difficulty
        },
        parent: rootSkill.parentSkill || null,
        prerequisites: rootSkill.prerequisites || [],
        relatedSkills: rootSkill.relatedSkills || []
    };

    // If depth 2 requested, populate shallow 1-hop neighbours for prerequisites
    if (depth === 2 && graph.prerequisites.length > 0) {
        const prereqIds = graph.prerequisites.map((p) => p._id);
        const secondHop = await Skill.find({ _id: { $in: prereqIds } })
            .select("name slug prerequisites")
            .populate("prerequisites", "name slug category")
            .lean();

        const prereqMap = new Map(secondHop.map((s) => [s._id.toString(), s.prerequisites || []]));
        graph.prerequisites = graph.prerequisites.map((p) => ({
            ...p,
            prerequisites: prereqMap.get(p._id.toString()) || []
        }));
    }

    return res.status(200).json(
        new ApiResponse(200, graph, "Bounded skill graph retrieved successfully")
    );
});

// ==========================================
// 2. COURSE SKILL MAPPINGS (Instructor / Admin)
// ==========================================

/**
 * Instructor/Admin: Map a skill to a course
 */
export const createCourseSkill = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { skillId, importance = 1, targetLevel = "intermediate" } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Authorization: instructor must own the course unless admin
    if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify skills for this course");
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    const existingMapping = await CourseSkill.findOne({ course: courseId, skill: skillId });
    if (existingMapping) {
        throw new ApiError(409, "Skill is already mapped to this course");
    }

    const courseSkill = await CourseSkill.create({
        course: courseId,
        skill: skillId,
        importance,
        targetLevel
    });

    const populated = await CourseSkill.findById(courseSkill._id).populate("skill", "name slug category difficulty");

    return res.status(201).json(
        new ApiResponse(201, populated, "Skill mapped to course successfully")
    );
});

/**
 * Public/Authenticated: Get skills mapped to a course
 */
export const getCourseSkills = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const courseSkills = await CourseSkill.find({ course: courseId })
        .populate("skill", "name slug category difficulty description")
        .sort({ importance: -1, createdAt: 1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, courseSkills, "Course skills retrieved successfully")
    );
});

/**
 * Instructor/Admin: Remove a skill from a course
 */
export const deleteCourseSkill = asyncHandler(async (req, res) => {
    const { courseId, skillId } = req.params;

    if (!isValidObjectId(skillId)) {
        throw new ApiError(400, "Valid skillId parameter is required");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify skills for this course");
    }

    const deleted = await CourseSkill.findOneAndDelete({ course: courseId, skill: skillId });
    if (!deleted) {
        throw new ApiError(404, "Course skill mapping not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Skill removed from course successfully")
    );
});

// ==========================================
// 3. LESSON SKILL MAPPINGS (Instructor / Admin)
// ==========================================

/**
 * Instructor/Admin: Map a skill to a lesson
 */
export const createLessonSkill = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { skillId, contributionWeight = 1 } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const course = await Course.findById(lesson.course);
    if (!course) {
        throw new ApiError(404, "Course associated with lesson not found");
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify skills for this lesson");
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    const existingMapping = await LessonSkill.findOne({ lesson: lessonId, skill: skillId });
    if (existingMapping) {
        throw new ApiError(409, "Skill is already mapped to this lesson");
    }

    const lessonSkill = await LessonSkill.create({
        lesson: lessonId,
        skill: skillId,
        contributionWeight
    });

    const populated = await LessonSkill.findById(lessonSkill._id).populate("skill", "name slug category difficulty");

    return res.status(201).json(
        new ApiResponse(201, populated, "Skill mapped to lesson successfully")
    );
});

/**
 * Public/Authenticated: Get skills mapped to a lesson
 */
export const getLessonSkills = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const lessonSkills = await LessonSkill.find({ lesson: lessonId })
        .populate("skill", "name slug category difficulty description")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, lessonSkills, "Lesson skills retrieved successfully")
    );
});

/**
 * Instructor/Admin: Remove a skill from a lesson
 */
export const deleteLessonSkill = asyncHandler(async (req, res) => {
    const { lessonId, skillId } = req.params;

    if (!isValidObjectId(skillId)) {
        throw new ApiError(400, "Valid skillId parameter is required");
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    const course = await Course.findById(lesson.course);
    if (!course) {
        throw new ApiError(404, "Course associated with lesson not found");
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify skills for this lesson");
    }

    const deleted = await LessonSkill.findOneAndDelete({ lesson: lessonId, skill: skillId });
    if (!deleted) {
        throw new ApiError(404, "Lesson skill mapping not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Skill removed from lesson successfully")
    );
});

// ==========================================
// 4. ASSESSMENT SKILL MAPPINGS (Instructor / Admin)
// ==========================================

/**
 * Instructor/Admin: Map a skill to an assessment
 */
export const createAssessmentSkill = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;
    const { skillId, weight = 1 } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
        throw new ApiError(404, "Course associated with assessment not found");
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify skills for this assessment");
    }

    const skill = await Skill.findById(skillId);
    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    const existingMapping = await AssessmentSkill.findOne({ assessment: assessmentId, skill: skillId });
    if (existingMapping) {
        throw new ApiError(409, "Skill is already mapped to this assessment");
    }

    const assessmentSkill = await AssessmentSkill.create({
        assessment: assessmentId,
        skill: skillId,
        weight
    });

    const populated = await AssessmentSkill.findById(assessmentSkill._id).populate("skill", "name slug category difficulty");

    return res.status(201).json(
        new ApiResponse(201, populated, "Skill mapped to assessment successfully")
    );
});

/**
 * Public/Authenticated: Get skills mapped to an assessment
 */
export const getAssessmentSkills = asyncHandler(async (req, res) => {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const assessmentSkills = await AssessmentSkill.find({ assessment: assessmentId })
        .populate("skill", "name slug category difficulty description")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, assessmentSkills, "Assessment skills retrieved successfully")
    );
});

/**
 * Instructor/Admin: Remove a skill from an assessment
 */
export const deleteAssessmentSkill = asyncHandler(async (req, res) => {
    const { assessmentId, skillId } = req.params;

    if (!isValidObjectId(skillId)) {
        throw new ApiError(400, "Valid skillId parameter is required");
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(404, "Assessment not found");
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
        throw new ApiError(404, "Course associated with assessment not found");
    }

    if (req.user.role !== "admin" && course.instructor.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify skills for this assessment");
    }

    const deleted = await AssessmentSkill.findOneAndDelete({ assessment: assessmentId, skill: skillId });
    if (!deleted) {
        throw new ApiError(404, "Assessment skill mapping not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Skill removed from assessment successfully")
    );
});
