/** registration and login routes */

const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError("Username and password required", 400);
    }
    const user = await User.authenticate(username, password);
    if (user) {
      User.updateLoginTimestamp(username);
      const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token })
    }
    throw new ExpressError("Invalid username/password", 400);
  } catch (err) {
    return next(err)
  }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 **/

 router.post("/register", async function (req, res, next) {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError("Username, password, first name, last name, and phone required", 400);
    }
    const user = User.register(req.body);
    if (user) {
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ token })
    }
    throw new ExpressError("Unable to register new user", 500);
  } catch (err) {
    if (e.code === '23505') {
      return next(new ExpressError("Username taken. Please pick another!", 400));
    }
    return next(err);
  }
 });

module.exports = router;
