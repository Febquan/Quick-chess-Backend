const express = require("express");
const userAuthController = require("../../../controllers/user/auth/userAuthController");

const router = express.Router();

router.post(
  "/sendEmailRestorePassword",
  userAuthController.sendEmailRestorePassword
);
router.post("/restorePassword", userAuthController.RestorePassword);
module.exports = router;
