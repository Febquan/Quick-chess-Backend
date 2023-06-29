const express = require("express");
const userGameController = require("../../../controllers/user/game/userGameController");

const router = express.Router();

router.post("/changeElo", userGameController.changeElo);
module.exports = router;
