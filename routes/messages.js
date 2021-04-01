/** user routes */

const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const Message = require("../models/message");
const { ensureLoggedIn } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const result = await Message.get(req.params.id);
    if (
      result.from_user.username === req.user.username ||
      result.to_user.username === req.user.username
    ) {
      return res.json({ message: result });
    }
    throw new ExpressError("Unauthorized", 401);
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const { to_username, body } = req.body;
    if (!to_username || !body) {
      throw new ExpressError("to_username and body required", 400);
    }
    const m = await Message.create({
      from_username: req.user.username,
      to_username,
      body,
    });
    if (m) {
      return res.json({ message: m });
    }
    throw new ExpressError("Error creating message");
  } catch (err) {
    if (err.code === "23503") {
      return next(new ExpressError("Invalid to_username", 400));
    }
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    const m = await Message.get(req.params.id);
    if (m.to_user.username === req.user.username) {
      const result = await Message.markRead(req.params.id);
      return res.json({ message: result });
    }
    throw new ExpressError("Unauthorized", 401);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
