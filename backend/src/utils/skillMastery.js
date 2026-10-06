import { SkillEvidence } from "../models/skillEvidence.model.js";
import { StudentSkill } from "../models/studentSkill.model.js";
import { LessonSkill } from "../models/lessonSkill.model.js";
import { AssessmentSkill } from "../models/assessmentSkill.model.js";

/**
 * Deterministically recalculates and persists a student's mastery for a given skill
 * based on all recorded learning evidence.
 * Formula:
 *   mastery = Math.round(Σ(score × weight) / Σ(weight))
 * Clamped between 0 and 100.
 *
 * @param {string|ObjectId} studentId
 * @param {string|ObjectId} skillId
 * @returns {Promise<StudentSkill>}
 */
export const recalculateStudentSkillMastery = async (studentId, skillId) => {
    const evidences = await SkillEvidence.find({
        student: studentId,
        skill: skillId
    }).sort({ achievedAt: -1 });

    if (!evidences || evidences.length === 0) {
        return await StudentSkill.findOneAndUpdate(
            { student: studentId, skill: skillId },
            {
                masteryPercentage: 0,
                evidenceCount: 0,
                lastEvidenceAt: null,
                lastCalculatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const ev of evidences) {
        const weight = ev.weight > 0 ? ev.weight : 1;
        totalWeightedScore += ev.score * weight;
        totalWeight += weight;
    }

    const calculatedMastery = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
    const clampedMastery = Math.min(100, Math.max(0, calculatedMastery));

    const latestEvidence = evidences[0];

    const studentSkill = await StudentSkill.findOneAndUpdate(
        { student: studentId, skill: skillId },
        {
            masteryPercentage: clampedMastery,
            evidenceCount: evidences.length,
            lastEvidenceAt: latestEvidence ? latestEvidence.achievedAt : new Date(),
            lastCalculatedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return studentSkill;
};

/**
 * Records lesson completion skill evidence for all skills mapped to the lesson.
 * Idempotent: repeated calls for the same lesson update rather than duplicate.
 *
 * @param {string|ObjectId} studentId
 * @param {string|ObjectId} lessonId
 */
export const recordLessonSkillEvidence = async (studentId, lessonId) => {
    const lessonSkills = await LessonSkill.find({ lesson: lessonId });
    if (!lessonSkills || lessonSkills.length === 0) return;

    for (const mapping of lessonSkills) {
        const weight = mapping.contributionWeight || 1;
        await SkillEvidence.findOneAndUpdate(
            {
                student: studentId,
                skill: mapping.skill,
                sourceType: "lesson",
                sourceId: lessonId
            },
            {
                score: 100, // Completed relevant lesson = 100
                weight,
                achievedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await recalculateStudentSkillMastery(studentId, mapping.skill);
    }
};

/**
 * Records assessment submission skill evidence for all skills mapped to the assessment.
 * Idempotent: repeated calls for the same assessment update rather than duplicate.
 *
 * @param {string|ObjectId} studentId
 * @param {string|ObjectId} assessmentId
 * @param {number} scorePercentage
 */
export const recordAssessmentSkillEvidence = async (studentId, assessmentId, scorePercentage) => {
    const assessmentSkills = await AssessmentSkill.find({ assessment: assessmentId });
    if (!assessmentSkills || assessmentSkills.length === 0) return;

    const normalizedScore = Math.min(100, Math.max(0, Math.round(scorePercentage || 0)));

    for (const mapping of assessmentSkills) {
        const weight = mapping.weight || 1;

        // Check if previous evidence exists to maintain highest demonstrated mastery
        const existingEvidence = await SkillEvidence.findOne({
            student: studentId,
            skill: mapping.skill,
            sourceType: "assessment",
            sourceId: assessmentId
        });

        const finalScore = existingEvidence
            ? Math.max(existingEvidence.score, normalizedScore)
            : normalizedScore;

        await SkillEvidence.findOneAndUpdate(
            {
                student: studentId,
                skill: mapping.skill,
                sourceType: "assessment",
                sourceId: assessmentId
            },
            {
                score: finalScore,
                weight,
                achievedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await recalculateStudentSkillMastery(studentId, mapping.skill);
    }
};
