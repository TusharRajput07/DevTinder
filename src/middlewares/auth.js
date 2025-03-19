const jwt = require("jsonwebtoken");
const User = require("../config/model/user");

// middleware for authentication in api's after login
const userAuth = async (req, res, next) => {
  try {
    // get the token from the cookie and verify it

    const { token } = req.cookies;
    if (!token) {
      // when then user is not logged in. or the cookie has expired
      throw new Error("Token not valid");
    }

    // verify the token with the passkey and get the user id out

    const decodedObject = await jwt.verify(token, "DEV@Tinder$123");

    const { _id } = decodedObject;

    // get the user data out from the db

    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }

    req.user = user; // saving the user data to the req so that the handler can get the data after we call next
    next();
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

module.exports = {
  userAuth,
};
