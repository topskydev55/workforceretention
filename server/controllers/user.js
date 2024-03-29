const User = require("../models/user");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
//Validation Library
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

//Password-Generator Library
const generator = require("generate-password");

//Validation SCHEMA
// const userSchema = require('../validation/employee');

//LOAD EMAIL TEMPLATES
const email_template = require("../helpers/email_template");
const helpers = require("../helpers/email");

exports.Create = (req, res, next) => {
  const data = req.body;
  const { email } = req.body;

  if (!email) {
    return res
      .status(422)
      .send({ success: false, message: "Email is required!" });
  }
  User.findOne({ email }, async (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) {
      if (existingUser.username === data.username) {
        return res.status(422).send({
          success: false,
          message: "User with this username already exist!",
        });
      }
      return res.status(422).send({
        success: false,
        message: "User with this email already exist!",
      });
    }
    //before saving the employee to the database. hash password
    await bcrypt.genSalt(10, function (err, salt) {
      if (err) return next(err);
      //GENERATE THE PASSWORD HERE
      let password = generator.generate({
        length: 10,
        numbers: true,
      });
      bcrypt.hash(password, salt, async function (err, hash) {
        if (err) return next(err);
        // Store hash in your password DB.
        // Update the password of the data
        data.password = hash;
        const user = new User(data);

        user.save(function (err) {
          if (err) return next(err);
          User.findById(user._id, "-password -surveys -links")
            .populate({ path: "clients", model: "Client" })
            .then((user) => {
              //SEND THE USER EMAIL WITH THE USERNAME AND PASSWORD
              const from =
                email_template.UserEmailPasswordTemplate.from_address;
              let subject = email_template.UserEmailPasswordTemplate.subject;
              let body = email_template.UserEmailPasswordTemplate.body;
              let to = user.email;

              // step-2 : replace the [user_firstname] by the client.username
              body = body.replace("[user_firstname]", user.first_name);
              body = body.replace("[user_firstname]", user.first_name);

              // step-3 : [user_lastname] set the user lastname
              body = body.replace("[user_lastname]", user.last_name);

              // step-4 : [user_password] set the user plain password.
              body = body.replace("[user_email]", user.email);
              body = body.replace("[user_username]", user.email);
              body = body.replace("[user_password]", password);
              helpers
                .SendEmailToEmployee({ from, to, subject, body })
                .then(() => {
                  return res.status(200).send({
                    success: true,
                    message: "User successfully created",
                    user,
                  });
                })
                .catch(() => {
                  return next(new Error("Email send failed."));
                });
            })
            .catch((err) => {
              if (!err.statusCode) {
                err.statusCode = 500;
              }
              next(err);
            });
        });
      });
    });
  });
};

exports.Find = (req, res, next) => {
  let currentPage = Number(req.query.page || 1); //staticPage number
  const perPage = Number(req.query.perPage || 10); //total items display per staticPage
  let totalItems; //how many items in the database

  //We need to populate the employee
  User.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      //This will return a new promise with the posts.
      return User.find({}, "-password -surveys -clients -links")
        .populate({
          path: "role",
          model: "Role",
          select: "-permissions",
        })
        .skip(currentPage * perPage)
        .limit(perPage);
    })
    .then((users) => {
      return res.status(200).json({ success: true, users, totalItems });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.FindById = (req, res, next) => {
  let id = req.params.id;

  User.findById(id, "-password -surveys -links")
    .populate({ path: "clients", model: "Client" })
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      return res.status(200).send({
        success: true,
        message: "Data successfully retrieve",
        user,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.UpdateProfile = (req, res, next) => {
  // fetch the request data
  const data = req.body;
  let id = mongoose.Types.ObjectId(req.params.id);
  // This would likely be inside of a PUT request, since we're updating an existing document, hence the req.params.todoId.
  // Find the existing resource by ID
  User.findByIdAndUpdate(
    // the id of the item to find
    id,
    // the change to be made. Mongoose will smartly combine your existing
    // document with this change, which allows for partial updates too
    { $set: data },
    // an option that asks mongoose to return the updated version
    // of the document instead of the pre-updated one.
    { upsert: true, new: true }
  )
    .then((user) => {
      return res.send({
        success: true,
        message: "Profile updated successfully",
        user,
      });
    })
    .catch((err) => {
      // Handle any possible database errors
      if (err) return next(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.changePassword = (req, res, next) => {
  let id = mongoose.Types.ObjectId(req.params.id);
  let { old_password, new_password } = req.body;

  //check if request body has old_password
  if (!old_password || !new_password) {
    return res
      .status(422)
      .send({
        errors: [{ title: "Data missing!", detail: "Input correct data!" }],
      });
  }

  /**
   * check if the old_password matches
   */

  User.findById(id)
    .populate({ path: "role" })
    .then(async (user, err) => {
      if (err) throw new Error("Unable to find user");

      if (!user) {
        const error = new Error("User not found, please sign up.");
        error.statusCode = 401;
        throw error;
      }

      await bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.compare(old_password, user.password, function (error, matched) {
          if (error) return next(error);
          if (!matched) {
            const error = new Error("Invalid Old password.");
            error.statusCode = 400;
            return next(error);
          }
          bcrypt.hash(new_password, salt, async function (err, hash) {
            if (err) return next(err);
            // Store hash in your password DB.
            // Update the password of the data
            user.password = hash;
            user.save((err) => {
              if (err) return next(err);
              return res.status(200).send({
                success: true,
                message: "Password successfully changed",
                user,
              });
            });
          });
        });
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.Update = (req, res, next) => {
  // fetch the request data
  const data = req.body;
  let id = req.params.id;

  //check if request body has email

  // This would likely be inside of a PUT request, since we're updating an existing document, hence the req.params.todoId.
  // Find the existing resource by ID
  User.findByIdAndUpdate(
    // the id of the item to find
    id,
    // the change to be made. Mongoose will smartly combine your existing
    // document with this change, which allows for partial updates too
    data,
    // an option that asks mongoose to return the updated version
    // of the document instead of the pre-updated one.
    { new: true }
  )
    .populate({ path: "clients", model: "Client" })
    .then((user) => {
      if (!user)
        return res
          .status(404)
          .send({ success: false, message: "User not found. please sign up" });
      return res.send({
        success: true,
        message: "Record updated successfully",
        user,
      });
    })
    .catch((err) => {
      // Handle any possible database errors
      if (err) return next(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.Delete = (req, res, next) => {
  let id = req.params.id;

  const schema = Joi.object({
    id: Joi.objectId(),
  });

  const { error, value } = schema.validate({ id });
  if (error)
    return res.status(422).json({
      status: "error",
      message: "Invalid request data",
      data: error,
    });
  // The "todo" in this callback function represents the document that was found.
  // It allows you to pass a reference back to the staticPage in case they need a reference for some reason.
  User.findByIdAndRemove(id, (error, user) => {
    // As always, handle any potential errors:
    if (error) return next(error);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found. please sign up." });
    }
    // We'll create a simple object to send back with a message and the id of the document that was removed
    // You can really do this however you want, though.
    return res.send({
      success: true,
      message: "Record deleted successfully",
      data: user,
    });
  });
};

//RELATIONAL DATA FIND FUNCTIONS
exports.FindClient = (req, res, next) => {
  // const currentPage = req.query.staticPage || 1; //staticPage number
  // const perPage = req.query.perPage || 10; //total items display per staticPage
  const userId = req.params.userId;
  // let totalItems; //how many items in the database

  User.findById(userId, "-links -surveys -password")
    .populate({
      path: "clients",
      model: "Client",
      select: "-surveys -employees -organizations",
    })
    .exec(function (err, users) {
      if (err) return next(err);
      return res.status(200).json({ success: true, users });
    });
};

exports.FindSurveys = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
    .populate({
      path: "surveys",
      model: "Survey",
    })
    .exec(function (err, surveys) {
      if (err) return next(err);
      return res.status(200).json({ success: true, surveys });
    });
};
