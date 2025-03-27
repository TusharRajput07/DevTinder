const express = require("express");
const connectDB = require("./config/database");
const User = require("./config/model/user");
const cookieParser = require("cookie-parser");

const app = express();

// middleware provided by express to convert req json object to javascript object for all the below API's
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/authentication");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

// // api to get a user with email from db
// app.get("/user", async (req, res) => {
//   const userEmail = req.body.email;

//   try {
//     const users = await User.find({ email: userEmail }); // returns an array of all the matching docs with this email
//     if (users.length === 0) {
//       res.send("user not found");
//     } else {
//       res.send(users);
//     }
//   } catch (err) {
//     req.status(400).send("Something went wrong");
//   }
// });

// // api for the feed page : getting all the users from the db
// app.get("/feed", async (req, res) => {
//   try {
//     const users = await User.find({}); // empty filter returns all data
//     res.send(users);
//   } catch (err) {
//     res.status(400).send("Something went wrong");
//   }
// });

// // api to delete a user from db (by id)
// app.delete("/user", async (req, res) => {
//   const userId = req.body.userId;

//   try {
//     await User.findByIdAndDelete(userId);
//     res.send("user deleted successfully");
//   } catch (err) {
//     res.status(400).send("Something went wrong");
//   }
// });

// // api to update a user's data
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
