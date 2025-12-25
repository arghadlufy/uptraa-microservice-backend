import { z } from "zod";
import { ErrorHandler } from "../error-handler.js";

// Register schema based on users table
export const registerSchema = z
  .object({
    name: z
      .string({ message: "Name must be a string" })
      .min(1, "Name cannot be empty")
      .max(255, "Name must be less than 255 characters")
      .trim(),

    email: z
      .email({ message: "Please provide a valid email address" })
      .min(1, "Email cannot be empty")
      .max(255, "Email must be less than 255 characters")
      .toLowerCase()
      .trim(),

    password: z
      .string({ message: "Password must be a string" })
      .min(8, "Password must be at least 8 characters long")
      .max(255, "Password must be less than 255 characters"),

    phone_number: z
      .string({ message: "Phone number must be a string" })
      .trim()
      .min(1, "Phone number cannot be empty")
      .max(20, "Phone number must be less than 20 characters")
      .regex(
        /^(\+91[-\s]?)?[6-9]\d{9}$/,
        "Please provide a valid Indian phone number (must start with 6-9 and be 10 digits)"
      ),
    //     "9876543210"        ✅
    // "+919876543210"     ✅
    // "+91 9876543210"    ✅
    // "+91-9876543210"    ✅
    // "8765432109"        ✅
    // "7654321098"        ✅
    // "6543210987"

    role: z.enum(["jobseeker", "recruiter"], {
      message: "Role must be either 'jobseeker' or 'recruiter'",
    }),

    bio: z
      .string({ message: "Bio must be a string" })
      .max(5000, "Bio must be less than 5000 characters")
      .trim()
      .optional(),
  })
  .refine(
    (data) => {
      // If role is "jobseeker", bio is required
      if (data.role === "jobseeker") {
        return data.bio !== undefined && data.bio.trim().length > 0;
      }
      return true;
    },
    {
      message: "Bio is required for jobseekers",
      path: ["bio"],
    }
  );

// Infer TypeScript type from the schema
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .email({ message: "Please provide a valid email address" })
    .min(1, "Email cannot be empty")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: "Password must be a string" })
    .min(8, "Password must be at least 8 characters long")
    .max(255, "Password must be less than 255 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Transform Zod errors to user-friendly format
export function formatZodError(error: z.ZodError): string {
  const errors = error.issues.map((err) => {
    const path = err.path.join(".");
    return `${path ? `${path}: ` : ""}${err.message}`;
  });

  return errors.join(", ");
}

// Validate function that throws ErrorHandler if validation fails
export function validateRegisterInput(data: unknown): RegisterInput {
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    throw new ErrorHandler(400, errorMessage);
  }

  return result.data;
}

export function validateLoginInput(data: unknown): LoginInput {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    throw new ErrorHandler(400, errorMessage);
  }

  return result.data;
}
