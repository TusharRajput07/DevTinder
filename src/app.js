require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const User = require("./config/model/user");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./config/model/message");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.1.73:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/authentication");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

// create HTTP server and attach socket.io to it
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.1.73:5173"],
    credentials: true,
  },
});

// socket.io middleware to authenticate the user via cookie token
io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) throw new Error("No cookie found");

    // parse the token from cookie string
    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) throw new Error("Token not found");

    const decoded = jwt.verify(token, "DEV@Tinder$123");
    const user = await User.findById(decoded._id);
    if (!user) throw new Error("User not found");

    socket.user = user; // attach user to socket
    next();
  } catch (err) {
    next(new Error("Authentication failed: " + err.message));
  }
});

io.on("connection", (socket) => {
  console.log("user connected:", socket.user.firstName);
  // join a room — room ID is always the two user IDs sorted and joined
  // this ensures both users always end up in the same room regardless of who initiates
  socket.on("joinChat", ({ targetUserId }) => {
    const roomId = [socket.user._id.toString(), targetUserId].sort().join("_");
    socket.join(roomId);
    console.log(`${socket.user.firstName} joined room ${roomId}`);
  });

  // when a message is sent
  socket.on("sendMessage", async ({ targetUserId, text }) => {
    try {
      const roomId = [socket.user._id.toString(), targetUserId]
        .sort()
        .join("_");

      // save message to MongoDB
      const message = new Message({
        senderId: socket.user._id,
        receiverId: targetUserId,
        text: text.trim(),
      });
      await message.save();

      // broadcast to everyone in the room (including sender)
      io.to(roomId).emit("receiveMessage", {
        _id: message._id,
        senderId: socket.user._id,
        receiverId: targetUserId,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error("Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.user.firstName);
  });
});

// connect to DB then start server
connectDB()
  .then(() => {
    console.log("successfully connected to database");
    server.listen(7777, "0.0.0.0", () => {
      console.log("server successfully listening on port 7777");
    });
  })
  .catch((err) => {
    console.log("cannot connect to database");
  });
