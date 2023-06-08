const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY);
    } catch (err) {
      err.statusCode = 500;
      throw err;
    }
    if (!decodedToken) {
      const error = new Error("Not authenticated.");
      error.statusCode = 401;
      throw error;
    }
    req.userId = decodedToken.userId;
  }
  if (!authHeader) {
    req.userId = null;
  }
  next();
};
