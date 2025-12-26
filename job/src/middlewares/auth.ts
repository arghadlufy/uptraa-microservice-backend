import type { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../utils/error-handler.js";
import jwt from "jsonwebtoken";
import { sql } from "../utils/db.js";

export interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  role: "jobseeker" | "recruiter";
  bio?: string;
  resume?: string;
  resume_public_id?: string;
  profile_pic?: string;
  profile_pic_public_id?: string;
  subscription?: string;
  skills?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new ErrorHandler(401, "Unauthorized");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET! as string);

    const id = (decoded as { id: string }).id;

    if (!id) {
      throw new ErrorHandler(401, "Unauthorized");
    }

    const users = await sql`
        SELECT u.id, u.name, u.email, u.phone_number, u.role, u.bio, u.resume, u.resume_public_id, u.profile_pic, u.profile_pic_public_id, u.subscription, ARRAY_AGG(s.name)
        FILTER (WHERE s.name IS NOT NULL) AS skills
        FROM users u
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN skills s ON us.skill_id = s.id
        WHERE u.id = ${id}
        GROUP BY u.id
    `;

    if (users.length === 0) {
      throw new ErrorHandler(
        401,
        "User associated with this token does not exist"
      );
    }

    const user = users[0] as User;

    user.skills = user.skills ? user.skills : [];

    req.user = user;

    next();
  } catch (error) {
    console.log("[USER SERVICE] error in isAuth middleware", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
