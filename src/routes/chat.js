const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Message = require("../config/model/message");
const LastSeen = require("../config/model/lastseen");

const chatRouter = express.Router();

// get chat history between logged in user and another user
chatRouter.get("/chat/:userId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: loggedInUser._id, receiverId: userId },
        { senderId: userId, receiverId: loggedInUser._id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ data: messages });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// mark a conversation as seen — called when user opens a chat
chatRouter.patch("/chat/seen/:matchUserId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { matchUserId } = req.params;

    await LastSeen.findOneAndUpdate(
      { userId: loggedInUser._id, matchUserId },
      { lastSeenAt: new Date() },
      { upsert: true, new: true },
    );

    res.json({ message: "Marked as seen" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// get unread counts for all conversations — called on app load
chatRouter.get("/chat/unread/all", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const ConnectionRequest = require("../config/model/connectionRequests");

    // get all accepted connections
    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id, status: "accepted" },
        { toUserId: loggedInUser._id, status: "accepted" },
      ],
    });

    // extract the other user's ID from each connection
    const matchUserIds = connections.map((c) =>
      c.fromUserId.toString() === loggedInUser._id.toString()
        ? c.toUserId
        : c.fromUserId,
    );

    // get all lastSeen records for this user
    const lastSeenRecords = await LastSeen.find({
      userId: loggedInUser._id,
      matchUserId: { $in: matchUserIds },
    });

    // build map of matchUserId -> lastSeenAt
    const lastSeenMap = {};
    lastSeenRecords.forEach((record) => {
      lastSeenMap[record.matchUserId.toString()] = record.lastSeenAt;
    });

    // for each match count unread messages and get last message preview
    const unreadCounts = {};
    await Promise.all(
      matchUserIds.map(async (matchUserId) => {
        const lastSeenAt = lastSeenMap[matchUserId.toString()] || new Date(0);

        const count = await Message.countDocuments({
          senderId: matchUserId,
          receiverId: loggedInUser._id,
          createdAt: { $gt: lastSeenAt },
        });

        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUser._id, receiverId: matchUserId },
            { senderId: matchUserId, receiverId: loggedInUser._id },
          ],
        }).sort({ createdAt: -1 });

        if (count > 0 || lastMessage) {
          unreadCounts[matchUserId.toString()] = {
            count,
            lastMessage: lastMessage?.text || "",
            lastTime: lastMessage?.createdAt || null,
          };
        }
      }),
    );

    res.json({ data: unreadCounts });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = chatRouter;
