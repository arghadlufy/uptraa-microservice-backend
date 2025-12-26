import type { NextFunction, Response, Request } from "express";
import { tryCatch } from "../utils/try-catch.js";
import type { AuthenticatedRequest, User } from "../middlewares/auth.js";
import { sql } from "../utils/db.js";
import { ErrorHandler } from "../utils/error-handler.js";
import {
  validateAddSkillToUserInput,
  validateRemoveSkillFromUserInput,
  validateUpdateUserProfileInput,
} from "../utils/validations/user.js";
import { getBuffer } from "../utils/buffer.js";
import axios from "axios";

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
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone_number, 
        u.role, 
        u.bio, 
        u.resume, 
        u.resume_public_id, 
        u.profile_pic, 
        u.profile_pic_public_id, 
        u.subscription,
        CASE 
          WHEN u.location IS NOT NULL THEN ST_Y(u.location)::float 
          ELSE NULL 
        END AS latitude,
        CASE 
          WHEN u.location IS NOT NULL THEN ST_X(u.location)::float 
          ELSE NULL 
        END AS longitude,
        ARRAY_AGG(s.name) FILTER (WHERE s.name IS NOT NULL) AS skills
      FROM users u
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      WHERE u.id = ${id}
      GROUP BY u.id, u.location
    `;

    if (users.length === 0) {
      throw new ErrorHandler(404, "User not found");
    }

    const userRow = users[0] as any;
    const user: User = {
      ...userRow,
      skills: userRow.skills ? userRow.skills : [],
      location:
        userRow.latitude !== null && userRow.longitude !== null
          ? {
              latitude: userRow.latitude,
              longitude: userRow.longitude,
            }
          : undefined,
    };

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
    const { name, phone_number, bio, location } = validatedData;

    const newName = name || user.name;
    const newPhoneNumber = phone_number || user.phone_number;
    const newBio = bio !== undefined ? bio : user.bio;

    // Handle location update with PostGIS POINT
    // PostGIS POINT format: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    // Note: POINT uses (longitude, latitude) order, not (latitude, longitude)
    if (location) {
      const [updatedUser] = await sql`
        UPDATE users 
        SET 
          name = ${newName},
          phone_number = ${newPhoneNumber},
          bio = ${newBio},
          location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)
        WHERE id = ${user.id}
        RETURNING 
          id, 
          name, 
          email, 
          phone_number, 
          role, 
          bio,
          CASE 
            WHEN location IS NOT NULL THEN ST_Y(location)::float 
            ELSE NULL 
          END AS latitude,
          CASE 
            WHEN location IS NOT NULL THEN ST_X(location)::float 
            ELSE NULL 
          END AS longitude,
          created_at, 
          updated_at
      `;

      const updatedUserRow = updatedUser as any;
      const updatedUserWithLocation: User = {
        ...updatedUserRow,
        location:
          updatedUserRow.latitude !== null && updatedUserRow.longitude !== null
            ? {
                latitude: updatedUserRow.latitude,
                longitude: updatedUserRow.longitude,
              }
            : undefined,
      };

      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        user: updatedUserWithLocation,
      });
    } else {
      // Update without location
      const [updatedUser] = await sql`
        UPDATE users 
        SET 
          name = ${newName},
          phone_number = ${newPhoneNumber},
          bio = ${newBio}
        WHERE id = ${user.id}
        RETURNING 
          id, 
          name, 
          email, 
          phone_number, 
          role, 
          bio,
          CASE 
            WHEN location IS NOT NULL THEN ST_Y(location)::float 
            ELSE NULL 
          END AS latitude,
          CASE 
            WHEN location IS NOT NULL THEN ST_X(location)::float 
            ELSE NULL 
          END AS longitude,
          created_at, 
          updated_at
      `;

      const updatedUserRow = updatedUser as any;
      const updatedUserWithLocation: User = {
        ...updatedUserRow,
        location:
          updatedUserRow.latitude !== null && updatedUserRow.longitude !== null
            ? {
                latitude: updatedUserRow.latitude,
                longitude: updatedUserRow.longitude,
              }
            : undefined,
      };

      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        user: updatedUserWithLocation,
      });
    }
  }
);

export const updateProfilePicture = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }
    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "Profile picture is required");
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(400, "Invalid file");
    }

    const oldProfilePicPublicId = user.profile_pic_public_id;

    const { data } = await axios.post(
      `${process.env.PACKAGES_SERVICE_URL}/api/packages/upload`,
      {
        buffer: fileBuffer.content,
        public_id: oldProfilePicPublicId,
      }
    );

    const [updatedUser] = await sql`
      UPDATE users SET profile_pic = ${data.url}, profile_pic_public_id = ${data.public_id} WHERE id = ${user.id} RETURNING id, name, email, phone_number, role, bio, resume, resume_public_id, profile_pic, profile_pic_public_id, created_at, updated_at
    `;

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  }
);

export const updateResume = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }
    const file = req.file;

    if (!file) {
      throw new ErrorHandler(400, "Profile picture is required");
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer || !fileBuffer.content) {
      throw new ErrorHandler(400, "Invalid file");
    }

    const oldResumePublicId = user.resume_public_id;

    const { data } = await axios.post(
      `${process.env.PACKAGES_SERVICE_URL}/api/packages/upload`,
      {
        buffer: fileBuffer.content,
        public_id: oldResumePublicId,
      }
    );

    const [updatedUser] = await sql`
      UPDATE users SET resume = ${data.url}, resume_public_id = ${data.public_id} WHERE id = ${user.id} RETURNING id, name, email, phone_number, role, bio, resume, resume_public_id, profile_pic, profile_pic_public_id, created_at, updated_at
    `;

    res.status(200).json({
      success: true,
      message: "Resume updated successfully",
      user: updatedUser,
    });
  }
);

export const allSkills = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const skills = await sql`SELECT id, name FROM skills`;
    res.status(200).json({
      success: true,
      message: "All skills fetched successfully",
      skills,
    });
  }
);

export const getUserSkills = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const userSkills =
      await sql`SELECT s.name FROM skills s JOIN user_skills us ON s.id = us.skill_id WHERE us.user_id = ${user.id}`;

    res.status(200).json({
      success: true,
      message: "User skills fetched successfully",
      userSkills,
    });
  }
);

export const addSkillToUser = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const validatedData = validateAddSkillToUserInput(req.body);
    const { name } = validatedData;

    // have 3 tables to check: skills, user_skills, users
    // 1. check if skill exists in skills table by name
    // 2. if skill does not exist in skills table, add it to skills table
    // 3. check if skill exists in user_skills table
    // 4. check if user exists in users table (redundant check, but keeping for safety)
    // 5. add skill to user_skills table

    // Check if skill exists by name (since name is unique)
    let existingSkill = await sql`SELECT id FROM skills WHERE name = ${name}`;

    let skillId: string;

    if (existingSkill.length === 0) {
      // Skill doesn't exist, create it
      const newSkillResult = await sql`
        INSERT INTO skills (name) 
        VALUES (${name}) 
        RETURNING id, name, created_at, updated_at
      `;

      if (newSkillResult.length === 0 || !newSkillResult[0]) {
        throw new ErrorHandler(500, "Failed to create skill");
      }

      skillId = newSkillResult[0].id;
    } else {
      // Skill exists, use its id
      if (!existingSkill[0]) {
        throw new ErrorHandler(500, "Failed to retrieve skill");
      }
      skillId = existingSkill[0].id;
    }

    // Check if user already has this skill
    const existingUserSkill = await sql`
      SELECT user_id, skill_id 
      FROM user_skills 
      WHERE user_id = ${user.id} AND skill_id = ${skillId}
    `;

    if (existingUserSkill.length > 0) {
      throw new ErrorHandler(409, "Skill already added to user");
    }

    // Add skill to user_skills table
    const newUserSkillResult = await sql`
      INSERT INTO user_skills (user_id, skill_id) 
      VALUES (${user.id}, ${skillId}) 
      RETURNING user_id, skill_id
    `;

    if (newUserSkillResult.length === 0 || !newUserSkillResult[0]) {
      throw new ErrorHandler(500, "Failed to add skill to user");
    }

    res.status(200).json({
      success: true,
      message: "Skill added to user successfully",
      userSkill: newUserSkillResult[0],
    });
  }
);

export const removeSkillFromUser = tryCatch(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    const validatedData = validateRemoveSkillFromUserInput(req.body);
    const { name } = validatedData;

    // remove it from user_skills table only. do not delete the skill from skills table.
    // 1. check if skill exists in skills table by name
    // 2. check if skill exists in user_skills table
    // 3. remove it from user_skills table

    let existingSkill = await sql`SELECT id FROM skills WHERE name = ${name}`;
    if (existingSkill.length === 0) {
      throw new ErrorHandler(404, "Skill not found");
    }

    let existingUserSkill =
      await sql`SELECT user_id, skill_id FROM user_skills WHERE user_id = ${user.id} AND skill_id = ${existingSkill[0]?.id}`;

    if (existingUserSkill.length === 0) {
      throw new ErrorHandler(404, "Skill not found in user's skills");
    }

    const [removedUserSkill] =
      await sql`DELETE FROM user_skills WHERE user_id = ${user.id} AND skill_id = ${existingSkill[0]?.id} RETURNING user_id, skill_id`;

    res.status(200).json({
      success: true,
      message: "Skill removed from user successfully",
      userSkill: removedUserSkill,
    });
  }
);
