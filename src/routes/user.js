const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../config/model/connectionRequests");
const User = require("../config/model/user");
const userRouter = express.Router();

// api to get all the pending connection requests of the logged in user
userRouter.get("/user/requests/recieved", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      toUserId: loggedInUser,
      status: "interested",
    }).populate("fromUserId", [
      "firstName",
      "lastName",
      "age",
      "gender",
      "bio",
    ]);

    res.json({
      message: "Data fetched successfully",
      data: connectionRequests,
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// api to get all the matches (accepted connections) of the logged in user
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", ["firstName", "lastName", "age", "gender", "bio"])
      .populate("toUserId", ["firstName", "lastName", "age", "gender", "bio"]);

    // now we only need the user name and other details. we dont want details about the connection request. so well remove it

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({ data });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// api to get the feed of a logged in user
userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
        { _id: { $ne: loggedInUser._id } },
      ],
    })
      .select(["firstName", "lastName", "age", "gender", "bio"])
      .skip(skip)
      .limit(limit);

    res.send(users);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = userRouter;
