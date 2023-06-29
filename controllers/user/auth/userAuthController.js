const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mailer = require("../../../utils/mailer");
const User = require("../../../Model/user");

exports.checkUserName = async (req, res, next) => {
  try {
    const userName = req.body.userName;
    const userFind = await User.findOne({ userName: userName });
    if (userFind) {
      res
        .status(201)
        .json({ message: "User name đã được đăng ký!", ok: false });
    }
    if (userName?.length <= 5) {
      res.status(201).json({ message: "Tên quá ngắn!", ok: false });
    }
    if (userName?.length >= 30) {
      res.status(201).json({ message: "Tên quá dài!", ok: false });
    }
    res.status(201).json({ message: "User name hợp lệ!", ok: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.errors[0].msg);
      error.statusCode = 422;
      throw error;
    }
    const email = req.body.email;
    // const userFind = await User.findOne({ email: email });
    // if (userFind) {
    //   const error = new Error("Email đã được đăng ký");
    //   error.statusCode = 400;
    //   throw error;
    // }
    const userName = req.body.userName;
    const password = req.body.password;
    const hashedPw = await bcrypt.hash(password, 12);
    const hashedUserName = await jwt.sign(
      {
        email: email,
        userName: userName,
      },
      process.env.TOKEN_PRIVATE_KEY,
      { expiresIn: "8h" }
    );
    const user = new User({
      email: email,
      password: hashedPw,
      userName: userName,
    });
    const result = await user.save();
    mailer(
      result.email,
      "Chess email verification",
      `<h2>Xin vui lòng click vào <a href="${process.env.APP_URL}/user/verify?&token=${hashedUserName}">đường link này</a> để xác thực mail của bạn</h2>

      `
    );
    res
      .status(201)
      .json({ message: "Tạo user thành công!", userId: result._id, ok: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = (req, res, next) => {
  const userName = req.body.userName;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ userName: userName })
    .then((user) => {
      if (!user) {
        const error = new Error("User không tồn tại !");
        error.statusCode = 400;
        throw error;
      }
      if (!user.emailVerify) {
        const error = new Error("Bạn chưa xác thực tài khoản");
        error.statusCode = 400;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Sai mật khẩu !");
        error.statusCode = 400;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        process.env.TOKEN_PRIVATE_KEY,
        { expiresIn: "8h" }
      );
      res.status(200).json({ token: token, ok: true });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.checkAutoLogin = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (userId) {
      const user = await User.findOne({ _id: userId });
      res.status(200).json({ name: user.userName, elo: user.elo, ok: true });
    } else {
      const error = new Error("Lần đăng nhập đã hết hạn");
      error.statusCode = 400;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.verify = async (req, res, next) => {
  try {
    const hashedUserName = req.query.token;
    const { userName } = await jwt.verify(
      hashedUserName,
      process.env.TOKEN_PRIVATE_KEY
    );

    if (userName) {
      await User.findOneAndUpdate(
        { userName: userName },
        { emailVerify: true }
      );
      res.status(200).json({ message: "Xác thực Email thành công", ok: true });
    } else {
      const error = new Error("Hệ thống không xác thực được email này !");
      error.statusCode = 400;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.errors[0].msg);
      error.statusCode = 422;
      throw error;
    }
    if (!req.userId) {
      const error = new Error("Không xác định được user !");
      error.statusCode = 400;
      throw error;
    }
    const userId = req.userId;
    const password = req.body.password;
    const hashedPw = await bcrypt.hash(password, 12);
    const user = await User.findById({ _id: userId });
    if (await bcrypt.compare(password, user.password)) {
      const error = new Error(
        "Mật khẩu mới không được trùng với mật khẩu trước !"
      );
      error.statusCode = 422;
      throw error;
    }
    user.password = hashedPw;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công !", ok: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.sendEmailRestorePassword = async (req, res, next) => {
  try {
    const email = req.body.email;

    if (!(await User.exists({ email: email }))) {
      const error = new Error("Email này chưa được đăng ký !");
      error.statusCode = 422;
      throw error;
    }
    const token = jwt.sign(
      {
        email: email,
      },
      process.env.TOKEN_PRIVATE_KEY,
      { expiresIn: "0.5h" }
    );
    await mailer(
      email,
      `Căn tin nhóm 18: Khôi phục mật khẩu `,
      `<h2>Xin vui lòng click vào <a href="${process.env.FRONT_END_URL}/user/restorePassword/${token}">đường link này</a> để thay đổi mật khẩu</h2>

      `
    );
    res
      .status(200)
      .json({ message: "Email thay đổi mật khẩu đã được gửi !", ok: true });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.RestorePassword = async (req, res, next) => {
  try {
    const decodedToken = jwt.verify(
      req.body.token,
      process.env.TOKEN_PRIVATE_KEY
    );

    const userEmail = decodedToken.email;
    const password = req.body.password;
    const hashedPw = await bcrypt.hash(password, 12);
    const user = await User.findOne({ email: userEmail });
    user.password = hashedPw;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công !", ok: true });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
