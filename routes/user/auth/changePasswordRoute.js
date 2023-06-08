const express = require("express");
const { body } = require("express-validator");

const User = require("../../../Model/user");
const userAuthController = require("../../../controllers/user/auth/userAuthController");

const router = express.Router();

router.post(
  "/changePassword",
  [body("password").trim().isLength({ min: 5 })],
  userAuthController.changePassword
);
module.exports = router;
