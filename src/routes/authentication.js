const express = require("express");
const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../config/model/user");

const authRouter = express.Router();

// api to save a user to the database
authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // validate the data
    validateSignUpData(req);

    // encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);

    // store the data

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
    });

    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("Error saving the user : " + err.message);
  }
});

// api to login a user
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user with this email is present in the db or not
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    // if yes, then compare the password with the hashed db password
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      // create a jwt token
      const token = await user.getJWT();

      // add the token to cookie
      res.cookie("token", token, { expires: new Date(Date.now() + 900000) });

      // send the response
      res.send(user);
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

// api to logout the user
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("logout successfull!");
});

module.exports = authRouter;
