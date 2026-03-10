const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email address not valid : " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter a strong password : " + value);
        }
      },
    },
    age: { type: Number, min: 18, max: 100 },
    userLocation: { type: String, trim: true },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: `{VALUE} is incorrect gender type`,
      },
    },
    bio: { type: String, maxlength: 300 },
    skills: { type: String, maxlength: 300 },
    hobbies: { type: String, maxlength: 300 },
    // up to 3 photos — index 0 is the main photo
    photos: {
      type: [String],
      default: [],
      validate(value) {
        if (value.length > 3) {
          throw new Error("You can only have up to 3 photos.");
        }
        value.forEach((url) => {
          if (!validator.isURL(url)) {
            throw new Error("Photo URL not valid: " + url);
          }
        });
      },
    },
  },
  { timestamps: true },
);

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, "DEV@Tinder$123", {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const passwordHash = user.password;
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    passwordHash,
  );
  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
