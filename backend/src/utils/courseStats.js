import { Lesson } from "../models/lesson.model.js";
import { Course } from "../models/course.model.js";

/**
 * Recalculates cached totalLessons and totalDuration for a course.
 *
 * @param {string|ObjectId} courseId
 */
export const recalculateCourseStats = async (courseId) => {
    if (!courseId) return;

    const stats = await Lesson.aggregate([
        { $match: { course: courseId } },
        {
            $group: {
                _id: null,
                totalLessons: { $sum: 1 },
                totalDuration: { $sum: "$duration" }
            }
        }
    ]);

    const totalLessons = stats[0]?.totalLessons || 0;
    const totalDuration = stats[0]?.totalDuration || 0;

    await Course.findByIdAndUpdate(courseId, {
        totalLessons,
        totalDuration
    });

    return { totalLessons, totalDuration };
};
