import { isValidObjectId } from "mongoose";
import { validate } from "../middlewares/validate.middleware.js";

const ALLOWED_STATUSES = ["active", "completed", "dropped"];

export const validateEnrollCourse = (req) => {
    const errors = [];
    const { courseId } = req.params || {};

    if (!courseId || !isValidObjectId(courseId)) {
        errors.push({ field: "courseId", message: "Valid course ID parameter is required" });
    }

    return errors;
};

export const validateMyCoursesQuery = (req) => {
    const errors = [];
    const { status } = req.query || {};

    if (status !== undefined && status !== "") {
        if (!ALLOWED_STATUSES.includes(status)) {
            errors.push({
                field: "status",
                message: `Status filter must be one of: ${ALLOWED_STATUSES.join(", ")}`
            });
        }
    }

    return errors;
};

export const enrollCourseValidator = validate(validateEnrollCourse);
export const myCoursesValidator = validate(validateMyCoursesQuery);
