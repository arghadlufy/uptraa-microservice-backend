export const forgotPasswordTemplate = (
  name: string,
  resetPasswordUrl: string
) => {
  return `
    <h1>Uptraa - Reset Password</h1>
    <p>Hello ${name},</p>
    <p>You are receiving this email because you (or someone else) have requested a password reset for your account.</p>
    <p>Please click the button below to reset your password:</p>
    <a href="${resetPasswordUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a><br><br>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thank you!</p>
    <p>Best regards,</p>
    <p>Uptraa Team</p>
  `;
};
