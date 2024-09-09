import express from "express";
import { Attendance } from "../controllers/Attendance";
import { TimeTable } from "../controllers/timetable";
import { Calender } from "../controllers/calender";
const router = express.Router();

router.post("/attendance", Attendance);
router.post("/timetable", TimeTable);
router.post("/calender", Calender);

export default router;
