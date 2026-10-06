import { isValidObjectId } from "mongoose";
import { StudentSkill } from "../models/studentSkill.model.js";
import { SkillEvidence } from "../models/skillEvidence.model.js";
import { Skill } from "../models/skill.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Student: Get personal computed skills list
 * Only accesses req.user._id (strictly student-isolated)
 */
export const getMySkills = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, category, minMastery } = req.query;

    const studentSkillQuery = { student: studentId };

    // Support search / category by filtering relevant skill IDs
    if (search || category) {
        const skillFilter = { isActive: true };
        if (search) {
            skillFilter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }
        if (category) {
            skillFilter.category = { $regex: `^${category}$`, $options: "i" };
        }

        const matchingSkills = await Skill.find(skillFilter).select("_id").lean();
        const matchingSkillIds = matchingSkills.map((s) => s._id);
        studentSkillQuery.skill = { $in: matchingSkillIds };
    }

    if (minMastery !== undefined && minMastery !== null && minMastery !== "") {
        const minVal = Number(minMastery);
        if (!isNaN(minVal)) {
            studentSkillQuery.masteryPercentage = { $gte: minVal };
        }
    }

    const [studentSkills, total] = await Promise.all([
        StudentSkill.find(studentSkillQuery)
            .populate("skill", "name slug category difficulty description")
            .sort({ masteryPercentage: -1, lastEvidenceAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        StudentSkill.countDocuments(studentSkillQuery)
    ]);

    // Format response cleanly
    const formatted = studentSkills.map((ss) => ({
        skill: ss.skill,
        masteryPercentage: ss.masteryPercentage,
        evidenceCount: ss.evidenceCount,
        lastEvidenceAt: ss.lastEvidenceAt,
        lastCalculatedAt: ss.lastCalculatedAt
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                skills: formatted,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            "Student skills retrieved successfully"
        )
    );
});

/**
 * Student: Get detailed mastery profile and evidence history for a single skill
 */
export const getMySkillDetails = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const { skillId } = req.params;

    if (!isValidObjectId(skillId)) {
        throw new ApiError(400, "Valid skill ID parameter is required");
    }

    const skill = await Skill.findById(skillId)
        .populate("parentSkill", "name slug category")
        .populate("prerequisites", "name slug category difficulty")
        .populate("relatedSkills", "name slug category difficulty")
        .lean();

    if (!skill) {
        throw new ApiError(404, "Skill not found");
    }

    const studentSkill = await StudentSkill.findOne({
        student: studentId,
        skill: skillId
    }).lean();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [evidences, totalEvidence] = await Promise.all([
        SkillEvidence.find({ student: studentId, skill: skillId })
            .sort({ achievedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SkillEvidence.countDocuments({ student: studentId, skill: skillId })
    ]);

    const latestEvidence = evidences.length > 0 ? evidences[0] : null;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                skill: {
                    _id: skill._id,
                    name: skill.name,
                    slug: skill.slug,
                    category: skill.category,
                    difficulty: skill.difficulty,
                    description: skill.description,
                    parentSkill: skill.parentSkill,
                    prerequisites: skill.prerequisites,
                    relatedSkills: skill.relatedSkills
                },
                masteryPercentage: studentSkill ? studentSkill.masteryPercentage : 0,
                evidenceCount: studentSkill ? studentSkill.evidenceCount : 0,
                lastEvidenceAt: studentSkill ? studentSkill.lastEvidenceAt : null,
                lastCalculatedAt: studentSkill ? studentSkill.lastCalculatedAt : null,
                latestEvidence,
                evidenceHistory: {
                    items: evidences,
                    total: totalEvidence,
                    page,
                    limit,
                    totalPages: Math.ceil(totalEvidence / limit)
                }
            },
            "Student skill details retrieved successfully"
        )
    );
});
