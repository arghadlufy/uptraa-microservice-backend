import express from "express";
import uploadFile from "../middlewares/multer.js";
import { isAuth } from "../middlewares/auth.js";
import { getUserProfile, myProfile } from "../controllers/user.js";

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.get("/:id", getUserProfile);

export default router;
