const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../config/model/user");
const {
  sendVerificationEmail,
  sendResetEmail,
  sendContactEmail,
} = require("../utils/emailService");

const authRouter = express.Router();

const isProd = process.env.NODE_ENV === "production";
const SEVEN_DAYS = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const cookieOptions = {
  expires: SEVEN_DAYS,
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

// api to save a user to the database
authRouter.post("/signup", async (req, res) => {
  try {
    let { firstName, lastName, email, password } = req.body;

    validateSignUpData(req);

    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        const token = crypto.randomBytes(32).toString("hex");
        existingUser.verificationToken = token;
        existingUser.verificationTokenExpiry = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        );
        await existingUser.save();
        const host = `${req.protocol}://${req.get("host")}`;
        await sendVerificationEmail(email, existingUser.firstName, token, host);
        return res.status(200).json({
          message: "verification_pending",
          info: "A new verification email has been sent. Please check your inbox.",
        });
      }
      return res
        .status(409)
        .json({ error: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    await user.save();

    const host = `${req.protocol}://${req.get("host")}`;
    await sendVerificationEmail(email, firstName, verificationToken, host);

    res.status(200).json({
      message: "verification_pending",
      info: "Account created! Please check your email to verify your account before logging in.",
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(400).send("ERROR : " + err.message);
  }
});

// api to verify email
authRouter.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.send(`
        <html>
          <body style="font-family:Arial,sans-serif;background:#291424;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
            <div style="text-align:center;padding:32px;">
              <div style="font-size:48px;margin-bottom:16px;">❌</div>
              <h2 style="color:#f87171;">Invalid or expired link</h2>
              <p style="color:#9a8a95;">Please sign up again to get a new verification email.</p>
            </div>
          </body>
        </html>
      `);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.send(`
      <html>
        <body style="font-family:Arial,sans-serif;background:#291424;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="text-align:center;padding:32px;">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h2 style="color:#4ade80;">Email verified successfully!</h2>
            <p style="color:#9a8a95;">You can now close this tab and log in to DevTinder.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(400).send("Something went wrong: " + err.message);
  }
});

// api to check if user has verified their email (used for polling)
authRouter.post("/check-verified", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ isVerified: false });
    res.json({ isVerified: user.isVerified });
  } catch (err) {
    res.status(400).json({ isVerified: false });
  }
});

// api to login a user
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox.",
      });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.getJWT();
      res.cookie("token", token, cookieOptions);
      res.send(user);
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).json({ message: "Something went wrong : " + err.message });
  }
});

// api to logout the user
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    ...cookieOptions,
    expires: new Date(Date.now()),
  });
  res.send("logout successfull!");
});

// api to send password reset email
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.json({
        message: "If this email exists, a reset link has been sent.",
      });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    await sendResetEmail(
      email,
      user.firstName,
      resetToken,
      `${req.protocol}://${req.get("host")}`,
    );

    res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// api to show reset password form
authRouter.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.send(`
      <html>
        <body style="font-family:Arial,sans-serif;background:#291424;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="text-align:center;padding:32px;">
            <div style="font-size:48px;margin-bottom:16px;">❌</div>
            <h2 style="color:#f87171;">Invalid or expired link</h2>
            <p style="color:#9a8a95;">Please request a new password reset link.</p>
          </div>
        </body>
      </html>
    `);
  }

  res.send(`
    <html>
      <body style="font-family:Arial,sans-serif;background:#291424;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="width:100%;max-width:420px;padding:32px;">
          <h2 style="color:#c084fc;text-align:center;margin-bottom:24px;">Set New Password 🔐</h2>
          <form id="resetForm">
            <div style="margin-bottom:16px;">
              <input id="password" type="password" placeholder="New password" style="width:100%;padding:14px;border-radius:999px;border:2px solid #555;background:transparent;color:#f0f0f0;font-size:16px;box-sizing:border-box;" />
            </div>
            <div style="margin-bottom:16px;">
              <input id="confirmPassword" type="password" placeholder="Confirm new password" style="width:100%;padding:14px;border-radius:999px;border:2px solid #555;background:transparent;color:#f0f0f0;font-size:16px;box-sizing:border-box;" />
            </div>
            <p id="errorMsg" style="color:#f87171;font-size:14px;text-align:center;min-height:20px;"></p>
            <button type="submit" id="submitBtn" style="width:100%;padding:14px;border-radius:999px;border:none;background:linear-gradient(to right,#753762,#4b1745);color:white;font-size:18px;cursor:pointer;margin-top:8px;">
              Reset Password
            </button>
          </form>
        </div>
        <script>
          document.getElementById('resetForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorMsg = document.getElementById('errorMsg');
            const submitBtn = document.getElementById('submitBtn');

            if (!password) return errorMsg.textContent = 'Password is required.';
            if (password.length < 8) return errorMsg.textContent = 'Password must be at least 8 characters.';
            if (!password.match('[A-Z]')) return errorMsg.textContent = 'Password must have at least one uppercase letter.';
            if (!password.match('[a-z]')) return errorMsg.textContent = 'Password must have at least one lowercase letter.';
            if (!password.match('[0-9]')) return errorMsg.textContent = 'Password must have at least one number.';
            if (!password.match('[!@#$%^&*]')) return errorMsg.textContent = 'Password must have at least one special character (!@#$%^&*).';
            if (password !== confirmPassword) return errorMsg.textContent = 'Passwords do not match.';

            submitBtn.textContent = 'Resetting...';
            submitBtn.disabled = true;
            errorMsg.textContent = '';

            const res = await fetch(window.location.href, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (res.ok) {
              document.body.innerHTML = \`
                <div style="text-align:center;padding:32px;">
                  <div style="font-size:48px;margin-bottom:16px;">✅</div>
                  <h2 style="color:#4ade80;">Password reset successfully!</h2>
                  <p style="color:#9a8a95;">You may close this window and log in with your new password.</p>
                </div>
              \`;
            } else {
              errorMsg.textContent = data.message || 'Something went wrong.';
              submitBtn.textContent = 'Reset Password';
              submitBtn.disabled = false;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// api to handle reset password form submission
authRouter.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "Password is required." });

    const isStrongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(password);
    if (!isStrongPassword)
      return res.status(400).json({
        message:
          "Password must be at least 8 characters with uppercase, lowercase, a number, and a special character.",
      });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link." });

    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// api to handle contact form submissions
authRouter.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }
    await sendContactEmail(name, email, message);
    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = authRouter;
