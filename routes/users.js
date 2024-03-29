"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, isAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    if (isAdmin(req, res)){
      const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }

        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    }
    else {
      throw new UnauthorizedError("You are not authorized to add a user");
    }
  } 
  catch (err) {
    return next(err);
  }
  });


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {
    if (isAdmin(req, res)){  
      const users = await User.findAll();
      return res.json({ users });
    }
    else {
      throw new UnauthorizedError("Must be an admin to access this page");
    }
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get("/:username", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    if (isAdmin(req, res)){
    // OR if user is currently logged in //....
      return res.json({ user })

    }  
    else {
      throw new UnauthorizedError("You are not authorized to add a user");
    };
    } catch (err) {
      return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch("/:username", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    if (isAdmin(req, res)){
    // OR if user is currently logged in //....      
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    }
    else {
      throw new UnauthorizedError("Unauthorized to make changes to user");
    }    
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete("/:username", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    // OR if user is currently logged in //....
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });    
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/jobs/[id]  { state } => { application }
 *
 * Returns {"applied": jobId}
 *
 * Authorization required: admin or same-user-as-:username
 * */

router.post("/:username/jobs/:id", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
      const jobId = +req.params.id;
      await User.applyToJob(req.params.username, jobId);
      return res.json({ applied: jobId });
    }

  catch (err) {
    return next(err);
  }
});

module.exports = router;
