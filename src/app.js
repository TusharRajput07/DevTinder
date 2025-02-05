const express = require("express");

const app = express();

// // handling different path requests
// app.use("/test", (req, res) => {
//   res.send("Hello from Test");
// });

// // this use function will match to all the method api calls to /page
// app.use("/page", (req, res) => {
//   res.send("Hello from page");
// });

// app.use("/", (req, res) => {
//   res.send("Hello from the dashboard");
// });

//---------------------------------------------------------------------------------------------------
// this will only handle get http method api calls on /user
// app.get("/user", (req, res) => {
//   // data fetch logic from the db...
//   res.send({ firstName: "Tushar", lastName: "Rajput" });
// });

// // post calls on /user
// app.post("/user", (req, res) => {
//   // data saving login to db...
//   res.send("data successfully saved to database");
// });

// // delete calls on /user
// app.delete("/user", (req, res) => {
//   // data deleting login from db...
//   res.send("data deleted from database");
// });

//---------------------------------------------------------------------------------------------------

// a simple example where we have 2 route handlers for the same route. we analyse the code by commenting
// different lines and putting next() at different places.
// app.use(
//   "/user",
//   (req, res, next) => {
//     console.log("handling first route handler.");
//     res.send("response 1");
//     next();
//   },
//   (req, res) => {
//     console.log("handling second route handler.");
//     // res.send("response 2");
//   }
// );

//---------------------------------------------------------------------------------------------------

// code below shows the need for middlewares. here we make handlers for getting the data and deleting a
// user from the db. but we want to authenticate the user first as we don't want anyone to use our apis

// app.get("/admin/getAllData", (req, res) => {
//   // 10 lines of code to authenticate the user
//   if (isAdminAuthorized) {
//     res.send("all data sent");
//   } else {
//     res.status(401).send("unauthorized request");
//   }
// });

// app.get("/admin/deleteUser", (req, res) => {
//   // 10 lines of code to authenticate the user
//   if (isAdminAuthorized) {
//     res.send("user deleted");
//   } else {
//     res.status(401).send("unauthorized request");
//   }
// });

// code below shows the use of middlewares to improve the code above

// middleware
app.use("/admin", (req, res, next) => {
  console.log("admin auth is getting checked");
  // 10 lines of code to authenticate the user
  if (!isAdminAuthorized) {
    res.status(401).send("unauthorized request");
  } else {
    next();
  }
});

// route handler
app.get("/admin/getAllData", (req, res) => {
  res.status(401).send("unauthorized request");
});

// route handler
app.get("/admin/deleteUser", (req, res) => {
  res.status(401).send("unauthorized request");
});

app.listen(3000, () => {
  console.log("server succesfully listening on port 3000");
});
