import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../utils/try-catch.js";

export const registerUser = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    res.json(email);
  }
);
