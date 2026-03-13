const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, firstName, token, host) => {
  const verificationURL = `${host}/verify-email/${token}`;

  await transporter.sendMail({
    from: `"DevTinder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your DevTinder account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #291424; color: #f0f0f0; padding: 32px; border-radius: 16px;">
        <h2 style="color: #c084fc; margin-bottom: 8px;">Welcome to DevTinder, ${firstName}! 👋</h2>
        <p style="color: #b0b0b0;">You're one step away from connecting with developers.</p>
        <p style="color: #b0b0b0;">Click the button below to verify your email address:</p>
        <a href="${verificationURL}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(to right, #753762, #4b1745); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
          Verify Email
        </a>
        <p style="color: #9a8a95; font-size: 12px;">This link expires in 24 hours. If you didn't sign up for DevTinder, you can ignore this email.</p>
      </div>
    `,
  });
};

const sendResetEmail = async (email, firstName, token, host) => {
  const resetURL = `${host}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"DevTinder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your DevTinder password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #291424; color: #f0f0f0; padding: 32px; border-radius: 16px;">
        <h2 style="color: #c084fc; margin-bottom: 8px;">Password Reset 🔐</h2>
        <p style="color: #b0b0b0;">Hi ${firstName}, we received a request to reset your DevTinder password.</p>
        <p style="color: #b0b0b0;">Click the button below to set a new password:</p>
        <a href="${resetURL}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: linear-gradient(to right, #753762, #4b1745); color: white; text-decoration: none; border-radius: 999px; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #9a8a95; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const sendContactEmail = async (name, email, message) => {
  await transporter.sendMail({
    from: `"DevTinder Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `New Contact Message from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #291424; color: #f0f0f0; padding: 32px; border-radius: 16px;">
        <h2 style="color: #c084fc; margin-bottom: 8px;">New Contact Message 📬</h2>
        <p style="color: #b0b0b0;"><strong style="color:#f0f0f0;">Name:</strong> ${name}</p>
        <p style="color: #b0b0b0;"><strong style="color:#f0f0f0;">Email:</strong> ${email}</p>
        <p style="color: #b0b0b0;"><strong style="color:#f0f0f0;">Message:</strong></p>
        <p style="color: #b0b0b0; background: #1e0f1a; padding: 16px; border-radius: 12px; line-height: 1.6;">${message}</p>
        <p style="color: #9a8a95; font-size: 12px; margin-top: 24px;">Reply directly to this email to respond to ${name}.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendResetEmail, sendContactEmail };
