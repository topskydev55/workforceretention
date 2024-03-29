const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const employeeSurveySchema = require('../schema/employee_survey');
const employeeSchema = new Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String
    },
    employee_id: {
        type: String,
        match: [/^[a-z0-9A-Z_]{0,32}$/],
        required: false,
        unique: false,
        default: null,
    },
    email: {
        type: String,
        min: [4, 'Too short, min is 4 characters'],
        max: [64, 'Too long, max is 64 characters'],
        unique: false,
        lowercase: true,
        required: 'Email is required',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
    },
    password: {
        type: String,
        min: [4, 'Too short, min is 4 characters'],
        max: [32, 'Too long, max is 32 characters'],
        required: 'Password is required'
    },
    position: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    mobile: {
        type: String
    },
    manager_name: {
        type: String,
        default: ""
    },
    note: {
        type: String,
        default: null
    },
    date_of_birth: {
        type: Date
    },
    hire_date: {
        type: Date
    },
    resign_date: {
        type: Date
    },
    exit_date: {
        type: Date
    },
    occupational_group: {
        type: String
    },
    is_active: {
        type: String,
        required: true
    },
    is_survey: {
        type: String,
        required: true
    },
    is_online: {
        type: String,
        required: true
    },
    is_report: {
        type: String,
        required: true
    },
    is_manager: {
        type: String,
        required: true
    },
    is_send_reminder_email: {
        type: Boolean,
        default: false
    },
    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    // the employee under the client
    client: {
        type: Schema.Types.ObjectId,
        ref: 'Client'
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    division: {
        type: Schema.Types.ObjectId,
        ref: 'Division'
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department'
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    surveys: [employeeSurveySchema]
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
