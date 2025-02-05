const mongoose = require("mongoose");

// a schema for a user of DevTinder. and creating a model of it and exporting exporting it

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  age: { type: Number },
  gender: { type: String },
  bio: { type: String, maxlength: 300 },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
