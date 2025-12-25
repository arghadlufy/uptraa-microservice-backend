import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../utils/try-catch.js";
import { validateRegisterInput } from "../utils/validations/auth.js";

export const registerUser = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate and get typed data
    const validatedData = validateRegisterInput(req.body);
    const { name, email, password, phone_number, role, bio } = validatedData;

    // Continue with your registration logic here...

    res.json({ message: "Registration successful", email });
  }
);
