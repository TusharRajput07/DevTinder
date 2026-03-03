const express = require("express");
const connectDB = require("./config/database");
const User = require("./config/model/user");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.1.73:5173"],
    credentials: true,
  })
);
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

// calling the connectDB function first. only then we'll start listening on port 3000
connectDB()
  .then(() => {
    console.log("successfully connected to database");
    app.listen(7777, "0.0.0.0", () => {
      console.log("server succesfully listening on port 7777");
    });
  })
  .catch((err) => {
    console.log("cannot connect to database");
  });
