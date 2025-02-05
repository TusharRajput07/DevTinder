const mongoose = require("mongoose");

// function to connect our application to the database of DevTinder using mongoose library
const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://tusharrajput2002:2XvEq0IdwoTSpmSw@studynode.mmpjp.mongodb.net/DevTinder"
  );
};

module.exports = connectDB;
