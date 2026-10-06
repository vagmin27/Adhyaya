import { Router } from "express";
import {
    enrollInCourse,
    getMyEnrolledCourses,
    getCourseEnrollment
} from "../controllers/enrollment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    enrollCourseValidator,
    myCoursesValidator
} from "../validators/enrollment.validator.js";

const router = Router();

// All enrollment routes require authentication
router.use(verifyJWT);

// Enrolled courses list
router.route("/my-courses").get(myCoursesValidator, getMyEnrolledCourses);

// Specific course enrollment actions
router
    .route("/:courseId")
    .post(enrollCourseValidator, enrollInCourse)
    .get(enrollCourseValidator, getCourseEnrollment);

export default router;
