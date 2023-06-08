const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  emailVerify: {
    type: Boolean,
    require: true,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
