import express from "express";
import { Attendance } from "../controllers/userController";

const router = express.Router();

router.post("/attendance", Attendance);

export default router;
