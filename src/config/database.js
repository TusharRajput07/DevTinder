const mongoose = require("mongoose");

// function to connect our application to the database of DevTinder using mongoose library
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

module.exports = connectDB;
