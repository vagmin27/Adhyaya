import mongoose from "mongoose";
import { AssessmentQuestion } from "../models/assessmentQuestion.model.js";
import { Assessment } from "../models/assessment.model.js";

/**
 * Recalculates cached totalQuestions and totalMarks for an assessment.
 *
 * @param {string|mongoose.Types.ObjectId} assessmentId
 */
export const recalculateAssessmentStats = async (assessmentId) => {
    if (!assessmentId) return { totalQuestions: 0, totalMarks: 0 };

    const objectId = typeof assessmentId === "string" ? new mongoose.Types.ObjectId(assessmentId) : assessmentId;

    const stats = await AssessmentQuestion.aggregate([
        { $match: { assessment: objectId } },
        {
            $group: {
                _id: null,
                totalQuestions: { $sum: 1 },
                totalMarks: { $sum: "$marks" }
            }
        }
    ]);

    const totalQuestions = stats[0]?.totalQuestions || 0;
    const totalMarks = stats[0]?.totalMarks || 0;

    await Assessment.findByIdAndUpdate(objectId, {
        totalQuestions,
        totalMarks
    });

    return { totalQuestions, totalMarks };
};
