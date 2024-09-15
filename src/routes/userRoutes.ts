import express from "express";
import { Attendance } from "../controllers/Attendance";
import { TimeTable } from "../controllers/timetable";
import { Calender } from "../controllers/calender";
import { UnifiedTimeTable } from "../controllers/UnifiedTimeTable"
const router = express.Router();

router.post("/attendance", Attendance);
router.post("/timetable", TimeTable);
router.post("/calender", Calender);
router.post("/unifiedtimetable", UnifiedTimeTable);

export default router;
