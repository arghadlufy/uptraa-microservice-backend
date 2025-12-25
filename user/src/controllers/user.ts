import type { NextFunction, Response, Request } from "express";
import { tryCatch } from "../utils/try-catch.js";
import type { AuthenticatedRequest, User } from "../middlewares/auth.js";
import { sql } from "../utils/db.js";
import { ErrorHandler } from "../utils/error-handler.js";
import { validateUpdateUserProfileInput } from "../utils/validations/user.js";

export const myProfile = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user,
    });
  }
);

export const getUserProfile = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

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
      throw new ErrorHandler(404, "User not found");
    }

    const user = users[0] as User;

    user.skills = user.skills ? user.skills : [];

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user,
    });
  }
);

export const updateUserProfile = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const validatedData = validateUpdateUserProfileInput(req.body);
    const { name, phone_number, bio } = validatedData;

    const newName = name || user.name;
    const newPhoneNumber = phone_number || user.phone_number;
    const newBio = bio || user.bio;

    const [updatedUser] = await sql`
          UPDATE users SET name = ${newName}, phone_number = ${newPhoneNumber}, bio = ${newBio} 
          WHERE id = ${user.id} 
          RETURNING id, name, email, phone_number, role, bio, created_at, updated_at
          `;

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: updatedUser,
    });
  }
);
