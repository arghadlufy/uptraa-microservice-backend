import express from "express";
import uploadFile from "../middlewares/multer.js";
import { isAuth } from "../middlewares/auth.js";
import {
  addSkillToUser,
  getUserProfile,
  myProfile,
  updateProfilePicture,
  updateResume,
  updateUserProfile,
} from "../controllers/user.js";

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.get("/:id", getUserProfile);
router.put("/me", isAuth, updateUserProfile);
router.put("/me/profile-picture", isAuth, uploadFile, updateProfilePicture);
router.put("/me/resume", isAuth, uploadFile, updateResume);
router.post("/me/skills", isAuth, addSkillToUser);

export default router;
