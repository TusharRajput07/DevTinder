const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Name is not valid");
  } else if (!validator.isEmail(email)) {
    throw new Error("Email is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Enter a strong password");
  }
};

const validateUpdateProfileData = (req) => {
  const allowedUpdates = [
    "firstName",
    "lastName",
    "bio",
    "age",
    "gender",
    "photoURL",
  ];

  const isUpdateAllowed = Object.keys(req.body).every((field) =>
    allowedUpdates.includes(field)
  );

  return isUpdateAllowed;
};

module.exports = { validateSignUpData, validateUpdateProfileData };
