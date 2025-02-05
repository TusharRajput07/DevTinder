const express = require("express");
const connectDB = require("./config/database");
const User = require("./config/model/user");

const app = express();

// api to save a user to the database
app.post("/signup", async (req, res) => {
  const user = new User({
    firstName: "Elon",
    lastName: "Musk",
    email: "musk@gmail.com",
    age: 55,
    gender: "male",
    bio: "jaadu hi kehde  ",
  });

  try {
    await user.save();
    res.send("User added successfully");
  } catch (err) {
    res.status(400).send("Error saving the user" + err.message);
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
