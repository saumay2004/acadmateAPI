import express from "express";
import { auth } from "../controllers/authenticator";

const router = express.Router();

router.post("/login", auth);

export default router;
