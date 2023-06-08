const express = require("express");
const { body } = require("express-validator");
const isUserRoute = require("./is-user");
const User = require("../../../Model/user");
const userAuthController = require("../../../controllers/user/auth/userAuthController");

const router = express.Router();

router.post("/checkUserName", userAuthController.checkUserName);

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Email không hợp lệ")

      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Mật khẩu phải trên 5 ký tự"),
    body("userName")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Tên không được bỏ trống")
      .custom((value, { req }) => {
        return User.findOne({ userName: value }).then((AdminDoc) => {
          if (AdminDoc) {
            return Promise.reject("User name đã được đăng ký");
          }
        });
      }),
  ],
  userAuthController.signup
);

router.post("/login", userAuthController.login);

router.get("/verify", userAuthController.verify);

router.get("/checkAutoLogin", isUserRoute, userAuthController.checkAutoLogin);
module.exports = router;
