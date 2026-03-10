const mongoose = require("mongoose");

const lastSeenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    matchUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// compound index — one record per user pair
lastSeenSchema.index({ userId: 1, matchUserId: 1 }, { unique: true });

const LastSeen = mongoose.model("LastSeen", lastSeenSchema);
module.exports = LastSeen;
