import type { NextFunction, Request, Response } from "express";
import { tryCatch } from "../utils/try-catch.js";
import {
  validateForgotPasswordInput,
  validateLoginInput,
  validateRegisterInput,
  validateResetPasswordInput,
} from "../utils/validations/auth.js";
import { sql } from "../utils/db.js";
import { ErrorHandler } from "../utils/error-handler.js";
import bcrypt from "bcrypt";
import { getBuffer } from "../utils/buffer.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { forgotPasswordTemplate } from "../utils/email/forgot-password-template.js";
import { publistToTopic } from "../producer.js";
import { redisClient } from "../index.js";

export const registerUser = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate and get typed data
    const validatedData = validateRegisterInput(req.body);
    const { name, email, password, phone_number, role, bio } = validatedData;

    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;

    if (existingUser.length > 0) {
      throw new ErrorHandler(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let registeredUser;

    if (role === "recruiter") {
      const [user] =
        await sql`INSERT INTO users (name, email, password, phone_number, role) VALUES 
        (${name}, ${email}, ${hashedPassword}, ${phone_number}, ${role}) RETURNING
        id, name, email, phone_number, role, created_at, updated_at`;

      registeredUser = user;
    } else if (role === "jobseeker") {
      const file = req.file;

      if (!file) {
        throw new ErrorHandler(400, "Resume is required");
      }

      const fileBuffer = getBuffer(file);

      if (!fileBuffer || !fileBuffer.content) {
        throw new ErrorHandler(400, "Invalid file");
      }

      const { data } = await axios.post(
        `${process.env.PACKAGES_SERVICE_URL}/api/packages/upload`,
        {
          buffer: fileBuffer.content,
        }
      );

      const [user] =
        await sql`INSERT INTO users (name, email, password, phone_number, role, bio, resume, resume_public_id) VALUES 
        (${name}, ${email}, ${hashedPassword}, ${phone_number}, ${role}, ${bio}, ${data.url}, ${data.public_id}) RETURNING
        id, name, email, phone_number, role, bio, resume, resume_public_id, created_at, updated_at`;

      registeredUser = user;
    }

    const token = jwt.sign(
      { id: registeredUser?.id },
      process.env.JWT_SECRET! as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN! as unknown as number,
      }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: registeredUser,
      token,
    });
  }
);

export const loginUser = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate and get typed data
    const validatedData = validateLoginInput(req.body);
    const { email, password } = validatedData;

    const existingUser = await sql`
      SELECT u.id, u.name, u.email, u.password, u.phone_number, u.role, u.bio, u.resume, u.profile_pic, u.subscription, ARRAY_AGG(s.name) 
      FILTER (WHERE s.name IS NOT NULL) AS skills 
      FROM users u 
      LEFT JOIN user_skills us ON u.id = us.user_id 
      LEFT JOIN skills s ON us.skill_id = s.id 
      WHERE u.email = ${email} 
      GROUP BY u.id`;

    if (existingUser.length === 0) {
      throw new ErrorHandler(401, "Invalid credentials");
    }

    const userObject = existingUser[0];

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userObject?.password
    );

    if (!isPasswordCorrect) {
      throw new ErrorHandler(401, "Invalid credentials");
    }

    userObject!.skills = userObject!.skills ? userObject!.skills : [];

    delete userObject?.password;

    const token = jwt.sign(
      { id: userObject?.id },
      process.env.JWT_SECRET! as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN! as unknown as number,
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userObject,
      token,
    });
  }
);

export const forgotPassword = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate and get typed data
    const validatedData = validateForgotPasswordInput(req.body);
    const { email } = validatedData;

    const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;

    if (users.length === 0) {
      console.log("❌ [AUTH SERVICE] User not found");
      return res.status(200).json({
        success: true,
        message:
          "If the email exists, a password reset email will be sent to you",
      });
    }

    const user = users[0];

    const resetToken = jwt.sign(
      { email: user?.email, type: "reset" },
      process.env.JWT_SECRET! as string,
      {
        expiresIn: process.env
          .JWT_RESET_PASSWORD_EXPIRES_IN! as unknown as number,
      }
    );

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await redisClient.set(`forgot:${email}`, resetToken, {
      expiration: {
        type: "EX",
        value: Number(process.env.REDIS_RESET_PASSWORD_EXPIRES_IN),
      },
    });

    const message = {
      to: email,
      subject: "Uptraa - Reset Password",
      html: forgotPasswordTemplate(user?.name || "", resetPasswordUrl),
    };

    publistToTopic("send-mail", message);

    res.status(200).json({
      success: true,
      message:
        "If the email exists, a password reset email will be sent to you",
    });
  }
);

export const resetPassword = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate and get typed data
    const validatedData = validateResetPasswordInput(req.body);
    const { token, password } = validatedData;

    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET! as string);
    } catch (error) {
      throw new ErrorHandler(401, "Invalid or expired token");
    }

    if (decodedToken.type !== "reset") {
      throw new ErrorHandler(401, "Invalid token");
    }

    const resetToken = await redisClient.get(`forgot:${decodedToken.email}`);
    if (!resetToken || resetToken !== token) {
      throw new ErrorHandler(401, "Invalid token");
    }

    await redisClient.del(`forgot:${decodedToken.email}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${decodedToken.email}`;

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  }
);
