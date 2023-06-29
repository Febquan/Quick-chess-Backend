require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

const userAuthRoute = require("./routes/user/auth/userAuthRoute");
const isUserRoute = require("./routes/user/auth/is-user");
const restorePasswordRoute = require("./routes/user/auth/restorePasswordRoute");
const changePasswordRoute = require("./routes/user/auth/changePasswordRoute");
const gameControlRoute = require("./routes/user/game/gameControl");
//cors
app.use(cors());
app.options("*", cors());
app.use(bodyParser.json());

//Allowance
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/user", userAuthRoute);
app.use("/user", isUserRoute, changePasswordRoute);
app.use("/user", restorePasswordRoute);
app.use("/user", gameControlRoute);

app.get("/", (req, res, next) => {
  res.send("hello");
});
//Error Handling
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message, ok: false });
});

mongoose
  .connect(process.env.MOGOODB_DATABASE_LINK)
  .then((result) => {
    const server = app.listen(process.env.PORT);
    const io = require("./utils/getSocketConnection").init(server);

    const handleIo = require("./handleIo");
    handleIo(io);
  })
  .catch((err) => console.log(err));
