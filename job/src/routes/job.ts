import express from "express";
import uploadFile from "../middlewares/multer.js";
import { isAuth } from "../middlewares/auth.js";

const router = express.Router();

export default router;
