import { z } from "zod";
import { ErrorHandler } from "../error-handler.js";

export const updateUserProfileSchema = z
  .object({
    name: z.string({ message: "Name must be a string" }).optional(),
    phone_number: z
      .string({ message: "Phone number must be a string" })
      .optional(),
    bio: z.string({ message: "Bio must be a string" }).optional(),
  })
  .strict(); // strict means that the object must match the schema exactly, no extra properties allowed

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

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

// Transform Zod errors to user-friendly format
export function formatZodError(error: z.ZodError): string {
  const errors = error.issues.map((err) => {
    const path = err.path.join(".");
    return `${path ? `${path}: ` : ""}${err.message}`;
  });

  return errors.join(", ");
}
