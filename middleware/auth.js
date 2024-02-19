"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError("You must be logged in to complete this request");
    return next();
  } catch (err) {
    return next(err);
  }
}


function isAdmin(req, res, next) {
  try {
    let token = req.headers.authorization.split(' ')[1];
    let user = jwt.decode(token);
    console.log(user)

    return user.isAdmin
  }
  catch(err){
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  isAdmin
};

// function getToken(req) {
// token = req.headers.authorization.split(' ')[1];
// return token;
// }