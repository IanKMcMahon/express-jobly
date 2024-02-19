"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, isAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();



/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try { 
      
    if (isAdmin(req, res)){
      console.log(req);
      const validator = jsonschema.validate(req.body, companyNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.create(req.body);
      return res.status(201).json({ company });

    }
    else {
      throw new BadRequestError("You are not authorized to add a company");
    }
  }
  catch (err) {
    return next(err);
}});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */



router.get("/", async function (req, res, next) {
  try {
    // Extracting query parameters
    const companies = await Company.findAll();
    const { name, minEmployees, maxEmployees, ...args  } = req.query;
    console.log(args == {});
    console.log(Object.entries(args).length);

  if (Object.entries(args).length === 0) {  
    
    if ((!minEmployees) && (!maxEmployees) && (!name)) {
      res.send(companies);
    }  

    if (minEmployees && maxEmployees && parseInt(minEmployees) > parseInt(maxEmployees)) {
    throw new BadRequestError("minEmployees cannot be greater than maxEmployees");  
    }

    if (minEmployees) {
      customFilter((c) => c.numEmployees >= minEmployees, res, companies)

    }
    if (maxEmployees) {
      customFilter((c) => c.numEmployees <= maxEmployees, res, companies)

    }
    if (name) {
      const companiesByName = companies.filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
      res.send(companiesByName);
    }

  }
  else {
    throw new BadRequestError(`Param not valid`);
  }
}
  catch (err) {
    return next(err);
  }

});

function customFilter(condition, res, companies) {
  res.send(companies.filter(condition))
} 

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    if (isAdmin(req, res)){
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  }
  else {
    throw new BadRequestError("You are not authorized to change a company");
  }
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    if (isAdmin(req, res)){
        await Company.remove(req.params.handle);
        return res.json({ deleted: req.params.handle });
    }
    else {
        throw new BadRequestError("You are not authorized to Delete a company");
    }
  }     
  catch (err) {
    return next(err);
  }
});


module.exports = router;
