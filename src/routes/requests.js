const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../config/model/user");
const ConnectionRequest = require("../config/model/connectionRequests");

const requestRouter = express.Router();

// api to send connection request in form of interested or ignored

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id; // userAuth put it (logged in user)
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      // now before saving, we'll validate each corner case

      // first, the status can only have two values for this api

      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res.status(404).json({ message: "invalid status type!" });
      }

      // second, to toUserId must exist in the database. it should be a valid user

      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(404).json({ message: "user not found!" });
      }

      // third, make sure that there already doesn't exist a connection request from fromUserId to toUserId and vice versa

      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "connection request already exists!" });
      }

      // fourth, make sure the same person is not sending the request to themselves (handled by pre in the schema)

      // now you are good to save to db
      const newConnectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await newConnectionRequest.save();

      res.json({
        message:
          "connection request established between " +
          req.user.firstName +
          " and " +
          toUser.firstName,
        data,
      });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

// api to review connection request and then either accept them or reject them

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user; // from userAuth
      const { status, requestId } = req.params; // requestID is the id of fromUserId, who sent the request

      // now, think of this api from the receiver's perspective

      // first, make sure that the status (from your side) is valid
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "invalid status type!" });
      }

      // second, the request to review should be valid, meaning there should exist a valid request in the connection collection in db from requestId to me (loggedInUser's id), and the status should only be 'interested'.
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "interested",
      });

      console.log(requestId, loggedInUser);

      console.log(connectionRequest);

      if (!connectionRequest) {
        return res
          .status(404)
          .json({ message: "connection request not found!" });
      }

      // now you can update the connection request in db and save it
      connectionRequest.status = status;
      const data = await connectionRequest.save();
      res.json({ message: "connection request " + status, data });
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  }
);

module.exports = requestRouter;
