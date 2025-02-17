const express = require("express");
const connectDB = require("./config/database");
const User = require("./config/model/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();

// middleware provided by express to convert req json object to javascript object for all the below API's
app.use(express.json());

app.use(cookieParser());

// api to save a user to the database
app.post("/signup", async (req, res) => {
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
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user with this email is present in the db or not
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    // if yes, then compare the password with the hashed db password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // create a jwt token
      const token = await jwt.sign({ _id: user._id }, "DEV@Tinder$123");

      // add the token to cookie
      res.cookie("token", token);

      // send the response
      res.send("login successfull!");
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

// api to get the profile of user by cookie token after authentication
app.get("/profile", async (req, res) => {
  try {
    // fetch the token from the cookie
    const cookies = req.cookies;
    const { token } = cookies;
    if (!token) {
      throw new Error("Invalid Token");
    }

    // authentication : verify the token with passkey
    const jwtData = await jwt.verify(token, "DEV@Tinder$123");
    const { _id } = jwtData;

    // find the user by id
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found. Login Again");
    }

    // send the response data
    res.send(user);
  } catch (err) {
    res.status(400).send("Something went wrong : " + err.message);
  }
});

// api to get a user with email from db
app.get("/user", async (req, res) => {
  const userEmail = req.body.email;

  try {
    const users = await User.find({ email: userEmail }); // returns an array of all the matching docs with this email
    if (users.length === 0) {
      res.send("user not found");
    } else {
      res.send(users);
    }
  } catch (err) {
    req.status(400).send("Something went wrong");
  }
});

// api for the feed page : getting all the users from the db
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({}); // empty filter returns all data
    res.send(users);
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

// api to delete a user from db (by id)
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;

  try {
    await User.findByIdAndDelete(userId);
    res.send("user deleted successfully");
  } catch (err) {
    res.status(400).send("Something went wrong");
  }
});

// api to update a user's data
app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;

  try {
    const ALLOWED_UPDATES = ["bio", "age", "gender", "photoURL"];

    const isUpdateAllowed = Object.keys(data).every((k) =>
      ALLOWED_UPDATES.includes(k)
    );

    if (!isUpdateAllowed) {
      throw new Error("update not allowed");
    }

    await User.findByIdAndUpdate(userId, data);
    // or
    // const user = await User.findByIdAndUpdate(userId, data, {
    //   returnDocument: "before",
    // });
    // console.log(user);
    res.send("User data updated successfully");
  } catch (err) {
    res.status(400).send("Update Failed : " + err.message);
  }
});

// calling the connectDB finction first. only then we'll start listening on port 3000
connectDB()
  .then(() => {
    console.log("successfully connected to database");
    app.listen(7777, () => {
      console.log("server succesfully listening on port 7777");
    });
  })
  .catch((err) => {
    console.log("cannot connect to database");
  });
