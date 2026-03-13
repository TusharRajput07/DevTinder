const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateUpdateProfileData } = require("../utils/validation");

const profileRouter = express.Router();

// api to get the profile of user by cookie token after authentication
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

// api to update the details of a user after authentication and validation
profileRouter.patch("/profile/update", userAuth, async (req, res) => {
  try {
    if (!validateUpdateProfileData(req)) {
      throw new Error("Invalid update request!");
    }

    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();

    res.json({ message: "Profile updated successfully!", data: loggedInUser });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// api to delete the account of the logged in user
profileRouter.delete("/profile/delete", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    await loggedInUser.deleteOne();

    // clear the cookie
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.json({ message: "Account deleted successfully!" });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

module.exports = profileRouter;
