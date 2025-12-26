import { z } from "zod";
import { ErrorHandler } from "../error-handler.js";

export const updateUserProfileSchema = z
  .object({
    name: z.string({ message: "Name must be a string" }).optional(),
    phone_number: z
      .string({ message: "Phone number must be a string" })
      .optional(),
    bio: z.string({ message: "Bio must be a string" }).optional(),
    location: z
      .object({
        latitude: z
          .number({
            message: "Latitude must be a number",
          })
          .min(-90, "Latitude must be between -90 and 90")
          .max(90, "Latitude must be between -90 and 90"),
        longitude: z
          .number({
            message: "Longitude must be a number",
          })
          .min(-180, "Longitude must be between -180 and 180")
          .max(180, "Longitude must be between -180 and 180"),
      })
      .optional(),
  })
  .strict(); // strict means that the object must match the schema exactly, no extra properties allowed

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export const addSkillToUserSchema = z
  .object({
    name: z
      .string({ message: "Skill name must be a string" })
      .min(1, "Skill name cannot be empty")
      .max(100, "Skill name must be less than 100 characters")
      .trim()
      .regex(
        /^[A-Z][a-z]*( [A-Z][a-z]*)*$/,
        "Skill name must start with a capital letter, each word must start with a capital letter, and only letters and spaces are allowed (no numbers or special characters)"
      ),
  })
  .strict();

export type AddSkillToUserInput = z.infer<typeof addSkillToUserSchema>;

export const removeSkillFromUserSchema = z
  .object({
    name: z
      .string({ message: "Skill name must be a string" })
      .min(1, "Skill name cannot be empty")
      .max(100, "Skill name must be less than 100 characters")
      .trim()
      .regex(
        /^[A-Z][a-z]*( [A-Z][a-z]*)*$/,
        "Skill name must start with a capital letter, each word must start with a capital letter, and only letters and spaces are allowed (no numbers or special characters)"
      ),
  })
  .strict();

export type RemoveSkillFromUserInput = z.infer<
  typeof removeSkillFromUserSchema
>;

export function validateUpdateUserProfileInput(
  data: unknown
): UpdateUserProfileInput {
  const result = updateUserProfileSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    throw new ErrorHandler(400, errorMessage);
  }
  return result.data;
}

export function validateAddSkillToUserInput(
  data: unknown
): AddSkillToUserInput {
  const result = addSkillToUserSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    throw new ErrorHandler(400, errorMessage);
  }
  return result.data;
}

export function validateRemoveSkillFromUserInput(
  data: unknown
): RemoveSkillFromUserInput {
  const result = removeSkillFromUserSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    throw new ErrorHandler(400, errorMessage);
  }
  return result.data;
}

// Transform Zod errors to user-friendly format
export function formatZodError(error: z.ZodError): string {
  const errors = error.issues.map((err) => {
    const path = err.path.join(".");
    return `${path ? `${path}: ` : ""}${err.message}`;
  });

  return errors.join(", ");
}
