const Employee = require("../models/employee");
const EmployeeSchema = require("../validation/employee");
const mongoose = require("mongoose");

//RELATIONAL MODEL
const Client = require("../models/client");
const Organization = require("../models/organization");

//Validation Library
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

//Config
const config = require("../config");

//JSON FILE PARSING LIBRARY
let csvToJson = require("convert-csv-to-json");

// PASSWORD GENERATOR LIBRARY
const generator = require("generate-password");

//LOAD EMAIL TEMPLATES
const helpers = require("../helpers/email");
const refreshTokens = {};
const occupationalMatch = {
  "Not Classified": 1,
  Managers: 2,
  Professionals: 3,
  "Technicians and Trade Workers": 4,
  "Community and Personal Service Workers": 5,
  "Clerical and Administrative Workers": 6,
  "Sales Workers": 7,
  "Machinery Operators and Drivers": 8,
  Labourers: 9,
};
exports.Upload = function (req, res, next) {
  let file = req.file;
  const employees = [];
  const clientId = req.params.clientId;
  //read file data
  //first find the client by it's clientId
  Client.findById(clientId)
    .populate([
      {
        path: "emails.email",
      },
    ])
    .exec(function (err, client) {
      console.log(client);
      if (err) return next(err);
      if (!client) {
        return res.status(404).json({
          status: false,
          message: "Client not found!",
        });
      }
      // check the client surveys.
      // if the client has no survey available then set a error message that No survey assigned to the client yet !
      if (client.surveys.length === 0) {
        return next(
          new Error("No exit interview assigned to the client yet !")
        );
      }
      let json = csvToJson.fieldDelimiter(",").getJsonFromCsv(file.path);
      //here get all the organization and organization division and division department
      Organization.find()
        .populate([
          {
            path: "divisions",
            model: "Division",
            populate: {
              path: "departments",
              model: "Department",
            },
          },
        ])
        .exec(async function (err, organizations) {
          if (err) return next(err);
          for (let i = 0; i < json.length; i++) {
            //here find the organization by name
            // console.log('BEFORE ORGANIZATION');
            // console.log(organizations);
            json[i].organization = findOrganizationByName(
              json[i].organization,
              organizations
            );
            // console.log('AFTER ORGANIZATION');
            // console.log(organizations);
            //here find the division by name
            // console.log('BEFORE DIVISION');
            // console.log(organizations);
            json[i].division = findDivisionByName(
              json[i].division,
              organizations
            );
            // console.log('AFTER DIVISION');
            // console.log(organizations);
            // here find the department by name
            // console.log('BEFORE DEPARTMENT');
            // console.log(organizations);
            json[i].department = findDepartmentByName(
              json[i].department,
              organizations
            );
            // console.log('AFTER DEPARTMENT');
            // console.log(organizations);

            // hire_date, exit_date, resign_date, date_of_birth
            if (!isNullOrEmpty(json[i].hire_date)) {
              json[i].hire_date = convertDateToUSFormat(json[i].hire_date);
            }
            if (!isNullOrEmpty(json[i].exit_date)) {
              json[i].exit_date = convertDateToUSFormat(json[i].exit_date);
            }
            if (!isNullOrEmpty(json[i].resign_date)) {
              json[i].resign_date = convertDateToUSFormat(json[i].resign_date);
            }
            if (!isNullOrEmpty(json[i].date_of_birth)) {
              json[i].date_of_birth = convertDateToUSFormat(
                json[i].date_of_birth
              );
            }

            // here before push the json object check if the employee client has assign surveys. if so then assign that surveys to the employee
            let clientSurveys = [];
            client.surveys.forEach((survey) => {
              let employeeSurvey = {
                survey: survey,
                completed: false,
                start_date: null,
                end_date: null,
              };
              clientSurveys.push(employeeSurvey);
            });
            if (json[i].occupational_group.trim() in occupationalMatch) {
              json[i].occupational_group =
                occupationalMatch[json[i].occupational_group.trim()];
            } else {
              json[i].occupational_group = 1;
            }
            json[i].surveys = clientSurveys;
            json[i].client = clientId;
            json[i].employee_id = json[i].employee_id
              ? json[i].employee_id
              : null;
            employees.push(json[i]);
            // console.log(json[i]);
          }
          //before generating password we need to checkout if employee exist with the given email
          let allEmployees = await Employee.find();
          let finalEmployeesArray = checkDuplicateEmployees(
            allEmployees,
            employees
          );

          // ****************** here first we need to insert employee then send password **************
          // Save the employees into the database
          // employee needs a password so first we need to generate password
          // after generating password we need to insert the employee
          // after inserting employee we need to send password in email
          await passwordGenerator(finalEmployeesArray).then(
            (employeesToUpload) => {
              Employee.insertMany(employeesToUpload, async (err, docs) => {
                if (err) {
                  console.log(err);
                  if (err.name === "BulkWriteError" && err.code === 11000) {
                    return next(
                      new Error(
                        `Employee with the email or employee id ${err.op.email} already exist`
                      )
                    );
                  }
                  return next(err);
                } else {
                  await sendEmailsToEmployees(employeesToUpload, client).then(
                    (employeesToUpload) => {
                      //After saving the employees insert all the employees id to the
                      //client employees array
                      docs.forEach((employee) => {
                        client.employees.push(employee);
                      });
                      //Finally save the client
                      client.save().then(() => {
                        return res.status(200).json({
                          employees: docs,
                          success: true,
                          message: `From ${employees.length} employees ${
                            employeesToUpload.length
                          } uploaded and ${
                            employees.length - employeesToUpload.length
                          } skip`,
                        });
                      });
                    }
                  );
                }
              });
            }
          );
        });
    });
};

const convertDateToUSFormat = function (date) {
  let split_date = date.split("/"); // dd/mm/yyyy (Australian Date Format)
  return split_date[1] + "/" + split_date[0] + "/" + split_date[2]; // usa formatted date
};

const checkDuplicateEmployees = function (employees, employeesToUpload) {
  let finalEmployeesToUpload = employeesToUpload;
  //for each employees to upload check if the employee exist in the employees array or not
  employeesToUpload.forEach((employee) => {
    //this line of code is checking if the employee exist with the email
    let checkedEmployee = employees.find(
      (e) =>
        e.email === employee.email ||
        (employee.employee_id &&
          (e.employee_id === employee.employee_id ||
            !/[A-Za-z0-9_]{0,32}/.test(employee.employee_id) ||
            employee.employee_id.length < 4))
    );

    if (!isNullOrEmpty(checkedEmployee)) {
      // if the employee exist with the email then it's eliminating from the final employees to upload array
      finalEmployeesToUpload = finalEmployeesToUpload.filter(
        (fe) => fe.email !== employee.email
      );
    }
  });

  return finalEmployeesToUpload;
  // if exist in the employees array then eliminate that employee
};

const isNullOrEmpty = function (obj) {
  return typeof obj === "undefined" || obj === null;
};

// This function will generate password as well as send email to employee
const passwordGenerator = function (employees) {
  const employeePromises = [];
  employees.map((employee) => {
    employeePromises.push(
      new Promise((resolve, reject) => {
        //generate salt
        bcrypt.genSalt(10, function (err, salt) {
          if (err) {
            reject(new Error("Something Wrong In Salt Generating"));
          }
          //GENERATE THE PASSWORD HERE
          const password = generator.generate({
            length: 6,
            numbers: true,
          });
          bcrypt.hash(password, salt, async function (err, hash) {
            if (err) {
              reject(new Error("Password can't generate"));
            } else {
              // assign the hash password to the employee
              employee.password = hash;
              employee.original_password = password;
              resolve(employee);
            }
          }); //----end of password hashing----
        }); //---end of salt generation----
      })
    );
  });
  return Promise.all(employeePromises);
};

const sendEmailsToEmployees = (employees, client) => {
  const employeePromises = [];
  employees.map((employee) => {
    employeePromises.push(
      new Promise((resolve, reject) => {
        // select email depending on client selected email template
        let from;
        let subject;
        let body;
        let to;
        let email = {};
        // select email depending on client selected email template
        //check if the employee is a manager or not
        // if employee is a manager then sent
        if (employee.is_manager === "1") {
          email = client.emails.find(
            (e) => e.email_type === "manager-report-email"
          );
        } else if (client.email_template === "template-one") {
          email = client.emails.find(
            (e) => e.email_type === "template-one-email"
          );
        } else {
          email = client.emails.find(
            (e) => e.email_type === "template-two-email"
          );
        }
        // send the password to the employee email
        // step-1 : first get the email template from the client for creating an employee
        from = email.from_address;
        subject = email.subject;
        body = email.body;
        to = employee.email;

        // step-2 : replace the [client_name] by the client.name
        body = body.replace("[client_name]", client.name);
        body = body.replace("[client_name]", client.name);
        subject = subject.replace("[client_name]", client.name);
        body = body.replace("[employee_firstname]", employee.first_name);

        // step-3 : [employee_username] set the employee email
        body = body.replace("[employee_username]", to);

        // step-4 : [employee_password] set the employee plain password.
        body = body.replace("[employee_password]", employee.original_password);
        // send email only if is_online is set to 1
        if (employee.is_online === "1") {
          helpers
            .SendEmailToEmployee({
              from,
              to,
              subject,
              body,
            })
            .then(
              () => {
                // if the promise full fill this block of code will execute
                // assign the hash password to the employee
                resolve(employee);
              },
              //if the promise rejected this code will execute
              () => {
                // assign the hash password to the employee
                resolve(employee);
              }
            ); // End of Send Email To Employee
        } else {
          resolve(employee);
        }
      })
    );
  });
  return Promise.all(employeePromises);
};
const findOrganizationByName = function (name, organizations) {
  let organizationId = null;
  let trimmedOrganization = name.trim();
  if (organizations !== null) {
    organizations.map((organization) => {
      if (
        organization.name.trim().toUpperCase() ===
        trimmedOrganization.toUpperCase()
      ) {
        organizationId = organization._id;
      }
    });
  }
  return organizationId;
};
const findDivisionByName = function (name, organizations) {
  let divisionId = null;
  let trimmedDivision = name.trim();
  organizations.map((organization) => {
    if (
      organization.divisions !== null &&
      typeof organization.divisions !== "undefined"
    ) {
      organization.divisions.map((division) => {
        if (
          division.name.trim().toUpperCase() === trimmedDivision.toUpperCase()
        ) {
          divisionId = division._id;
        }
      });
    }
  });
  return divisionId;
};

const findDepartmentByName = function (name, organizations) {
  let departmentId = null;
  let trimmedDepartment = name.trim();
  organizations.map((organization) => {
    if (
      organization.divisions !== null &&
      typeof organization.divisions !== "undefined"
    ) {
      organization.divisions.map((division) => {
        if (
          division.departments !== null &&
          typeof division.departments !== "undefined"
        ) {
          division.departments.map((department) => {
            if (
              department.name.trim().toUpperCase() ===
              trimmedDepartment.toUpperCase()
            ) {
              departmentId = department._id;
            }
          });
        }
      });
    }
  });
  return departmentId;
};

exports.Create = function (req, res, next) {
  const user = req.user;

  const data = req.body;
  const { email } = req.body;
  const clientId = req.params.clientId;
  data.employee_id = data.employee_id ? data.employee_id : null;

  if (!email) {
    return res.status(422).send({
      success: false,
      message: "Email address is required!",
    });
  }

  if (
    !/[A-Za-z0-9_]{0,32}/.test(data.employee_id) ||
    (data.employee_id && data.employee_id.length < 4)
  ) {
    return res.status(422).send({
      success: false,
      message: "Employee ID should be 4 to 32 alphanumeric characters",
    });
  }

  Employee.findOne(
    {
      email,
      client: clientId,
    },
    async (err, existingUser) => {
      if (err) return next(err);
      if (existingUser) {
        // if (data.employee_id && existingUser.employee_id === data.employee_id) {
        //     return res.status(422).send({
        //         success: false,
        //         message: 'Employee with this employee id already exist!'

        //     });
        // }
        return res.status(422).send({
          success: false,
          message: "Employee with this email already exist!",
        });
      }
      //before saving the employee to the database. hash password
      await bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        //GENERATE THE PASSWORD HERE
        const password = generator.generate({
          length: 10,
          numbers: true,
        });
        data.password = password;
        data.client = clientId;
        data.created_by = user._id;
        bcrypt.hash(data.password, salt, async function (err, hash) {
          if (err) return next(err);
          //First find the employee by id
          //now push this newClient to the employee clients array === employee.clients.push(newPost)
          //now save the employee. this will automatically creates the relationship
          //and the newClient will be added into the staticPage table
          Client.findById(clientId)
            .populate([
              {
                path: "emails.email",
              },
            ])
            .exec(function (err, client) {
              if (err) return next(err);
              if (!client) {
                return res.status(404).json({
                  status: false,
                  message: "Client not found!",
                });
              }
              // check the client surveys.
              // if the client has no survey available then set a error message that No survey assigned to the client yet !
              if (client.surveys.length === 0) {
                return next(
                  new Error("No exit interview assigned to the client yet !")
                );
              }
              // here before create the employee check if the employee client has assign surveys. if so then assign that surveys to the employee
              let clientSurveys = [];
              client.surveys.forEach((survey) => {
                let employeeSurvey = {
                  survey: survey,
                  completed: false,
                  start_date: null,
                  end_date: null,
                };
                clientSurveys.push(employeeSurvey);
              });
              data.surveys = clientSurveys;
              data.password = hash;
              const employee = new Employee(data);
              employee
                .save()
                .then((employee) => {
                  client.employees.push(employee);
                  client.save();
                })
                .then(() => {
                  //check if the client is set to email template one or template two
                  // select email depending on client selected email template
                  let from;
                  let subject;
                  let body;
                  let to;
                  let email = {};
                  // select email depending on client selected email template
                  // if employee is a manager then sent
                  if (employee.is_manager === "1") {
                    email = client.emails.find(
                      (e) => e.email_type === "manager-report-email"
                    );
                  } else if (client.email_template === "template-one") {
                    email = client.emails.find(
                      (e) => e.email_type === "template-one-email"
                    );
                  } else {
                    email = client.emails.find(
                      (e) => e.email_type === "template-two-email"
                    );
                  }
                  //Now send the email to the employee here
                  // step-1 : first get the email template from the client for creating an employee
                  from = email.from_address;
                  subject = email.subject;
                  body = email.body;
                  to = employee.email;

                  // step-2 : replace the [client_name] by the client.name
                  body = body.replace("[client_name]", client.name);
                  body = body.replace("[client_name]", client.name);
                  subject = subject.replace("[client_name]", client.name);
                  body = body.replace(
                    "[employee_firstname]",
                    employee.first_name
                  );

                  // step-3 : [employee_username] set the employee email
                  body = body.replace("[employee_username]", to);

                  // step-4 : [employee_password] set the employee plain password.
                  body = body.replace("[employee_password]", password);
                  // check if the employee is set to online or not. if set to is_online === '1' only then sent email
                  if (
                    employee.is_online === "1" ||
                    employee.is_manager === "1"
                  ) {
                    return helpers.SendEmailToEmployee({
                      from,
                      to,
                      subject,
                      body,
                    });
                  } else {
                    return Promise.resolve();
                  }
                })
                .then(() => {
                  return res.status(200).send({
                    success: true,
                    message: "Employee successfully created",
                    employee,
                  });
                })
                .catch((err) => {
                  next(err);
                });
            });
        });
      });
    }
  );
};

exports.Find = (req, res, next) => {
  const currentPage = Number(req.query.page || 1); //staticPage number
  const perPage = Number(req.query.perPage || 10); //total items display per staticPage
  let totalItems; //how many items in the database

  Employee.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      //This will return a new promise with the posts.
      return Employee.find()
        .skip(currentPage * perPage)
        .limit(perPage);
    })
    .then((employees) => {
      return res.status(200).json({
        success: true,
        employees,
        totalItems,
      });
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
  //don't send the password to the user
  // -password will eliminate  the password from the response
  Employee.findById(id, "-password")
    .populate({
      path: "client",
      model: "Client",
      select: "image",
    })
    .exec((err, employee) => {
      if (err) return next(err);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      return res.status(200).send({
        success: true,
        message: "Data successfully retrieve",
        employee,
      });
    });
};

//Login, Logout and Refresh Token Feature for employee
/**
 * this is used to authenticate employee to our api using email and password
 * POST api/v1/employee/login
 * @param req
 * @param res
 */

exports.login = function (req, res, next) {
  const { email, password } = req.body;
  /**
   * this is param checking if they are provided
   */
  if (!password || !email) {
    return next(new Error("Email and password is required"));
  }

  /**
   * check if the username matches any email
   */

  // here we need to populate the employee organization, employee division and department
  Employee.findOne(
    {
      email,
    },
    "employee_id email password first_name last_name is_manager is_survey is_report client"
  )
    .then((employee, err) => {
      if (err)
        return new Error("Unable to find employee with the email " + email);

      if (!employee) {
        const error = new Error("Employee not found, please sign up.");
        error.statusCode = 401;
        return next(error);
      }
      //check if the entered password is correct
      bcrypt.compare(password, employee.password, function (error, matched) {
        if (error) return next(error);

        if (!matched) {
          const error = new Error("Invalid email or password.");
          error.statusCode = 400;
          return next(error);
        }

        //save the date the token was generated for already inside toJSON()
        const employeeData = employee.toJSON();

        delete employeeData.password;

        //Generate refresh token
        let refreshToken = uuidv4();
        refreshTokens[refreshToken] = email;

        employeeData.login_type = "employee";
        let token = jwt.sign(employeeData, config.SECRET, {
          expiresIn: "7d",
        });

        //return the token here
        res.json({
          access_token: token,
          refresh_token: refreshToken,
          employee_id: employee._id,
        });
      });
    })
    .catch((err) => {
      next(err);
    });
};

/**
 * this is used to request for another token when the other token is about
 * expiring so for next request call the token can be validated as true
 * GET /api/v1/employee/token
 * @param req
 * @param res
 */

exports.token = function (req, res, next) {
  let email = req.body.email;
  let refreshToken = req.body.refreshToken;

  if (refreshToken in refreshTokens && refreshTokens[refreshToken] === email) {
    Employee.findOne(
      {
        email,
      },
      "employee_id email first_name last_name is_manager is_survey is_report client"
    )
      .then((employee, err) => {
        if (err) return next(err);
        if (!employee) {
          const error = new Error("Employee not found, please sign up.");
          error.statusCode = 401;
          return next(error);
        }

        // on employee we only need to set employee employee_id, password and email
        const employeeData = employee.toJSON();

        employeeData.login_type = "employee";
        const token = jwt.sign(employeeData, config.SECRET, {
          expiresIn: "7d",
        });
        return res.json({
          access_token: token,
          refresh_token: refreshToken,
          employee_id: employee._id,
        });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  } else {
    const error = new Error("Employee not found, please sign up.");
    error.statusCode = 401;
    return next(error);
  }
};

/**
 * POST /api/v1/employees/logout
 * @param req
 * @param res
 */
exports.logout = function (req, res) {
  let refreshToken = req.body.refreshToken;
  if (refreshToken in refreshTokens) {
    delete refreshTokens[refreshToken];
  }
  return res.status(200).json({
    success: true,
  });
};

const sendReminderEmails = function (req, res, next) {
  console.log("SEND REMINDER EMAILS");
  //*********************** STEPS ***************
  // STEP-1 : Find all the clients
  // STEP-2 : Check if the client is set for reminder email is on or off (send_reminder_email value true means on)
  // STEP-3 : if client is set for reminder email then find all the employees who are not a manager also who's is_survey is 1
  // STEP-4 : From the employees filtered out the employee who have not completed the survey
  // STEP-5 : Re-arrange data. {client_name :'',employee_firstname:'',employee_lastname,employee_email:'',employee_id:'',reminder_email:emailObject}
  // STEP-6 : Now Foreach employee send reminder email
  let employees = [];

  Client.find()
    .populate({
      path: "emails.email",
    })
    .populate({
      path: "employees",
      model: "Employee",
    })
    .exec(function (err, clients) {
      if (err) {
        console.log(err);
        return res.status(404).json({
          success: false,
        });
      } else {
        clients.forEach((client) => {
          // checking the client reminder email is on or off
          if (client.send_reminder_email) {
            client.employees.forEach((employee) => {
              // employee.is_manager === 0 means employee is not a manager
              // employee.is_survey === 1 means employee is allow to do survey
              // !employee.surveys[0].completed means employee still not completed the assigned survey
              // employee.is_online === 1 means employee will complete the survey online

              // check when the employee is inserted into database employee.createdAt
              const employeeCreatedDay = getDay(employee.createdAt, new Date());
              // && employeeCreatedDay === 5
              if (
                employee.is_manager === "0" &&
                employee.is_survey === "1" &&
                !employee.surveys[0].completed &&
                employee.is_online === "1" &&
                employee.is_active === "1" &&
                !employee.is_send_reminder_email &&
                (employeeCreatedDay == 5 || employeeCreatedDay == 10)
              ) {
                let employeeObject = {
                  client_name: client.name,
                  employee_id: employee._id,
                  employee_firstname: employee.first_name,
                  employee_lastname: employee.last_name,
                  employee_employee_id: employee.employee_id,
                  employee_email: employee.email,
                  reminder_email: client.emails.find(
                    (e) => e.email_type === "reminder-email"
                  ),
                };
                employees.push(employeeObject);
              }
            });
          }
        });
        sendReminderEmailsToEmployees(employees)
          .then(() => {
            // employees has property employee_id. so first we need to find out the employees by their id
            // then we need to update the property is_send_reminder_email to true
            employees.forEach((employee) => {
              Employee.findByIdAndUpdate(
                employee.employee_id,
                {
                  is_send_reminder_email: true,
                },
                {
                  new: true,
                },
                (err, employee) => {
                  if (err) {
                    return next(err);
                  }
                }
              );
            });
            console.log("Reminder Email Send Successful");
            console.log(res);
            return (
              (res &&
                res?.status(200).send({
                  success: true,
                  message: "Reminder Email Send Successful",
                })) ||
              true
            );
          })
          .catch((err) => {
            console.log(err);
            return res.status(404).json({
              success: false,
            });
          });
      }
    });
};

exports.sendReminderEmails = sendReminderEmails;

/**
 * GET /api/v1/employees/send-reminder-email
 * @param req
 * @param res
 */

const sendReminderEmailsToEmployees = function (employees) {
  const employeePromises = [];
  employees.map((employee) => {
    employeePromises.push(
      new Promise((resolve, reject) => {
        // here send the reminder email
        let from;
        let subject;
        let body;
        let to;
        let email = employee.reminder_email;

        //Now send the email to the employee here
        // step-1 : first get the email template from the client for creating an employee
        from = email.from_address;
        subject = email.subject;
        body = email.body;
        to = employee.employee_email;

        // step-2 : replace the [client_name] by the client.name
        body = body.replace("[client_name]", employee.client_name);
        body = body.replace(
          "[employee_firstname]",
          employee.employee_firstname
        );

        // step-3 : [employee_username] set the employee email
        body = body.replace("[employee_username]", to);

        helpers
          .SendEmailToEmployee({
            from,
            to,
            subject,
            body,
          })
          .then(() => {
            resolve(employee);
          })
          .catch((err) => {
            reject(err);
          });
      })
    );
  });
  return Promise.all(employeePromises);
};
// check within every 3 hours
const one_day = 86400000;
const five_minute = 300000;
const three_hours = 10800000;
setInterval(sendReminderEmails, three_hours);

const getDay = (start_date, end_date) => {
  let oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(
    Math.abs((start_date.getTime() - end_date.getTime()) / oneDay)
  );
};

exports.changePassword = (req, res, next) => {
  let employeeId = mongoose.Types.ObjectId(req.params.id);
  let { old_password, new_password, clientId } = req.body;

  //check if request body has old_password
  if (!old_password || !new_password) {
    return res.status(422).send({
      errors: [
        {
          title: "Data missing!",
          detail: "Input correct data!",
        },
      ],
    });
  }

  // check employee by the employeeId
  Employee.findById(employeeId, async (err, employee) => {
    if (err) return next(err);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    await bcrypt.genSalt(10, function (err, salt) {
      bcrypt.compare(
        old_password,
        employee.password,
        function (error, matched) {
          if (error) return next(error);
          if (!matched) {
            const error = new Error("Invalid Old password.");
            error.statusCode = 400;
            return next(error);
          }
          // find the client
          Client.findById(clientId)
            .populate([
              {
                path: "emails.email",
              },
            ])
            .exec(async function (err, client) {
              if (err) return next(err);
              if (!client) {
                return res.status(404).json({
                  status: false,
                  message: "Client not found!",
                });
              }
              //before saving the employee to the database. hash password
              if (err) return next(err);

              bcrypt.hash(new_password, salt, async function (err, hash) {
                if (err) return next(err);
                // send the password to the employee email
                // select email depending on client selected email template
                employee.password = hash;
                employee
                  .save()
                  .then((employee) => {
                    return res.status(200).send({
                      success: true,
                      message: "Password successfully updated",
                      employee,
                    });
                    // let from;
                    // let subject;
                    // let body;
                    // let to;
                    // let email = {};
                    // // select email depending on client selected email template
                    // // if employee is a manager then sent
                    // if (employee.is_manager === '1') {
                    //     email = client.emails.find(e => e.email_type === 'manager-report-email');
                    // } else if (client.email_template === 'template-one') {
                    //     email = client.emails.find(e => e.email_type === 'template-one-email');
                    // } else {
                    //     email = client.emails.find(e => e.email_type === 'template-two-email');
                    // }
                    // //Now send the email to the employee here
                    // // step-1 : first get the email template from the client for creating an employee
                    // from = email.from_address;
                    // subject = email.subject;
                    // body = email.body;
                    // to = employee.email;

                    // // step-2 : replace the [client_name] by the client.name
                    // body = body.replace('[client_name]', client.name);
                    // body = body.replace('[client_name]', client.name);
                    // subject = subject.replace('[client_name]', client.name);
                    // body = body.replace('[employee_firstname]', employee.first_name);

                    // // step-3 : [employee_username] set the employee email
                    // body = body.replace('[employee_username]', to);

                    // // step-4 : [employee_password] set the employee plain password.
                    // body = body.replace('[employee_password]', new_password);
                    // return helpers.SendEmailToEmployee({ from, to, subject, body });
                  })
                  .catch((err) => {
                    next(err);
                  });
              });
            });
        }
      );
    });
  });
};

/**
 * POST /api/v1/employees/generate-password/:clientId
 * @param req
 * @param res
 */
exports.generatePassword = function (req, res, next) {
  let clientId = req.params.clientId;
  let employeeId = req.body.employeeId;
  // check employee by the employeeId
  Employee.findById(employeeId, (err, employee) => {
    if (err) return next(err);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    // find the client
    Client.findById(clientId)
      .populate([
        {
          path: "emails.email",
        },
      ])
      .exec(async function (err, client) {
        if (err) return next(err);
        if (!client) {
          return res.status(404).json({
            status: false,
            message: "Client not found!",
          });
        }
        //before saving the employee to the database. hash password
        await bcrypt.genSalt(10, function (err, salt) {
          if (err) return next(err);
          //GENERATE THE PASSWORD HERE
          const password = generator.generate({
            length: 10,
            numbers: true,
          });
          bcrypt.hash(password, salt, async function (err, hash) {
            if (err) return next(err);
            // send the password to the employee email
            // select email depending on client selected email template
            employee.password = hash;
            employee
              .save()
              .then((employee) => {
                let from;
                let subject;
                let body;
                let to;
                let email = {};
                // select email depending on client selected email template
                // if employee is a manager then sent
                if (employee.is_manager === "1") {
                  email = client.emails.find(
                    (e) => e.email_type === "manager-report-email"
                  );
                } else if (client.email_template === "template-one") {
                  email = client.emails.find(
                    (e) => e.email_type === "template-one-email"
                  );
                } else {
                  email = client.emails.find(
                    (e) => e.email_type === "template-two-email"
                  );
                }
                //Now send the email to the employee here
                // step-1 : first get the email template from the client for creating an employee
                from = email.from_address;
                subject = email.subject;
                body = email.body;
                to = employee.email;

                // step-2 : replace the [client_name] by the client.name
                body = body.replace("[client_name]", client.name);
                body = body.replace("[client_name]", client.name);
                subject = subject.replace("[client_name]", client.name);
                body = body.replace(
                  "[employee_firstname]",
                  employee.first_name
                );

                // step-3 : [employee_username] set the employee email
                body = body.replace("[employee_username]", to);

                // step-4 : [employee_password] set the employee plain password.
                body = body.replace("[employee_password]", password);
                return helpers.SendEmailToEmployee({
                  from,
                  to,
                  subject,
                  body,
                });
              })
              .then(() => {
                return res.status(200).send({
                  success: true,
                  message: "Employee successfully created",
                  employee,
                });
              })
              .catch((err) => {
                next(err);
              });
          });
        });
      });
  });
};

exports.Update = (req, res, next) => {
  const user = req.user;

  // fetch the request data
  const data = {
    created_by: user._id,
    ...req.body,
  };
  let id = req.params.id;

  // Find the existing resource by ID
  Employee.findById(id)
    .populate({
      path: "client",
      model: "Client",
    })
    .exec((err, employee) => {
      // Check if email or id exist
      Employee.findOne(
        {
          email: data.email,
          client: employee.client._id,
          _id: {
            $ne: id,
          },
        },
        async (err, existingUser) => {
          if (err) return next(err);
          if (existingUser) {
            // if (data.employee_id && existingUser.employee_id === data.employee_id) {
            //     return res.status(422).send({
            //         success: false,
            //         message: 'Employee with this employee id already exist!'

            //     });
            // }
            return res.status(422).send({
              success: false,
              message: "Employee with this email already exist!",
            });
          }

          // This would likely be inside of a PUT request, since we're updating an existing document, hence the req.params.todoId.
          // Find the existing resource by ID
          Employee.findByIdAndUpdate(
            // the id of the item to find
            id,
            // the change to be made. Mongoose will smartly combine your existing
            // document with this change, which allows for partial updates too
            data,
            // an option that asks mongoose to return the updated version
            // of the document instead of the pre-updated one.
            {
              new: true,
            },

            // the callback function
            (err, employee) => {
              // if (err && err.name === 'MongoError' && err.code === 11000) {
              //     return next(new Error(`Employee with the email or employee id already exist`));
              // }
              // Handle any possible database errors
              if (err) return next(err);
              if (!employee)
                return res.status(404).json({
                  success: false,
                  message: "Employee not found.",
                });
              return res.send({
                success: true,
                message: "Record updated successfully",
                employee,
              });
            }
          );
        }
      );
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
      success: false,
      message: "Invalid request data",
      error,
    });
  // It allows you to pass a reference back to the staticPage in case they need a reference for some reason.
  Employee.findByIdAndRemove(id, (err, employee) => {
    // As always, handle any potential errors:
    if (err) return next(err);
    if (!employee)
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    // We'll create a simple object to send back with a message and the id of the document that was removed
    // You can really do this however you want, though.
    return res.send({
      success: true,
      message: "Record deleted successfully",
      employee,
    });
  });
};

//RELATIONAL DATA FIND FUNCTIONS
exports.FindSurveys = (req, res, next) => {
  const employeeId = req.params.employeeId;

  Employee.findById(employeeId)
    .populate({
      path: "surveys.survey",
    })
    .exec(function (err, employee) {
      if (err) return next(err);
      return res.status(200).json({
        success: true,
        surveys: employee.surveys,
      });
    });
};
