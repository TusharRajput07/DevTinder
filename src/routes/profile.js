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
    // first validate the req body and check if this is a valid update
    if (!validateUpdateProfileData(req)) {
      throw new Error("Invalid update request!");
    }

    // get the previous user details
    const loggedInUser = req.user;

    // add the new or updated details to the logged in user
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    // save the new user details to the db
    await loggedInUser.save();

    res.json({
      message: "Profile updated successfully!",
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

module.exports = profileRouter;
