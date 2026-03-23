const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../config/model/user");
const authRouter = express.Router();

const isProd = process.env.NODE_ENV === "production";

const getCookieOptions = () => ({
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
});

// api to save a user to the database
authRouter.post("/signup", async (req, res) => {
  try {
    let { firstName, lastName, email, password } = req.body;

    validateSignUpData(req);

    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      isVerified: true,
    });

    await user.save();
    const token = await user.getJWT();
    res.cookie("token", token, getCookieOptions());
    res.status(200).json({ message: "signup_success", data: user });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// api to login a user
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.getJWT();
      res.cookie("token", token, getCookieOptions());
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
    ...getCookieOptions(),
    expires: new Date(Date.now()),
  });
  res.send("logout successfull!");
});

module.exports = authRouter;
