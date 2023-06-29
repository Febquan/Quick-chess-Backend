const User = require("../../../Model/user");

exports.changeElo = async (req, res, next) => {
  try {
    const userName = req.body.userName;
    const eloChange = req.body.eloChange;
    const userFind = await User.findOne({ userName: userName });
    if (userFind) {
      res.status(200).json({ ok: true });
      userFind.elo = userFind.elo + eloChange;
      await userFind.save();
    } else {
      throw Error("Không tìm thấy tên!");
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
