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
const cron = require("node-cron");

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_NETWORK].filter(
      Boolean,
    ),
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("DevTinder API is running!");
});

const authRouter = require("./routes/authentication");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const aiRouter = require("./routes/ai");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", aiRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_NETWORK].filter(
      Boolean,
    ),
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) throw new Error("No cookie found");

    const token = cookie
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) throw new Error("Token not found");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) throw new Error("User not found");

    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication failed: " + err.message));
  }
});

io.on("connection", (socket) => {
  socket.on("joinChat", ({ targetUserId }) => {
    const roomId = [socket.user._id.toString(), targetUserId].sort().join("_");
    socket.join(roomId);
  });

  socket.on("sendMessage", async ({ targetUserId, text }) => {
    try {
      const roomId = [socket.user._id.toString(), targetUserId]
        .sort()
        .join("_");

      const message = new Message({
        senderId: socket.user._id,
        receiverId: targetUserId,
        text: text.trim(),
      });
      await message.save();

      io.to(roomId).emit("receiveMessage", {
        _id: message._id,
        senderId: socket.user._id,
        receiverId: targetUserId,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (err) {}
  });

  socket.on("disconnect", () => {});
});

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 7777, "0.0.0.0");

    // ping DB every 24 hours to prevent MongoDB Atlas from pausing
    cron.schedule("0 0 * * *", async () => {
      try {
        await User.findOne();
      } catch (err) {}
    });
  })
  .catch((err) => {});
