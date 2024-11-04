const express = require("express");

const app = express();

// handling different path requests
app.use("/test", (req, res) => {
  res.send("Hello from Test");
});

app.use("/page", (req, res) => {
  res.send("Hello from page");
});

app.use("/", (req, res) => {
  res.send("Hello from the dashboard");
});

app.listen(3000, () => {
  console.log("server succesfully listening on port 3000");
});
