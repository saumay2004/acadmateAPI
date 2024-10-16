import express from "express";
import { auth } from "../controllers/authenticator";
import { SignOut } from "../controllers/Signout";

const router = express.Router();

router.post("/login", auth);
router.post("/signout", SignOut);

export default router;
