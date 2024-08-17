import express from "express";
import { Attendance } from "../controllers/userController";
import { TimeTable } from "../controllers/timetable";

const router = express.Router();

router.post("/attendance", Attendance);
router.post("/timetable", TimeTable)

export default router;
