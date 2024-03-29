const checkEnv = require('./check_env')

// there are 4 types of client email
// ************** Client Email *********
// 1. InitialEmailTemplateOne
exports.InitialEmailTemplateOne = {
    email_type: 'template-one-email',
    editable: true,
    title: 'Initial Email - Template 1 (online survey)',
    description: 'This is the initial email that is sent to the employee inviting them to complete an on-line exit interview. Outsources systems only.',
    from_address: 'enquiries@workforceretention.com.au',
    subject: "Sorry you're leaving [client_name]",
    body: "Hi [employee_firstname],\r\n\r\n[client_name] has appointed us to manage their Exit Interview Program. They have asked us to contact and invite you to complete an on-line exit interview.\r\n\r\nIt's really important for [client_name] to capture the true sentiment of your experience. They genuinely want to translate your feedback into constructive action that will make a difference to employee retention in the future.\r\n\r\nAs independent specialists in employee retention we know that confidentiality plays a significant part in whether you can freely talk about your experience. Our process does not allow your personal responses to be disclosed to [client_name]. We'll wait until there is sufficient numbers to ensure anonimity, before functional results are collated and presented to management.\r\n\r\nThank you for taking the time to complete your exit interview. It should only take between 5-20 minutes, depending on how much feedback you'd like to contribute.\r\n\r\nPlease follow the instructions below, which detail your Login Username and Password.\r\n\r\nYour User Profile is;\r\n\r\nLogin Username: [employee_username]\r\nLogin Password: [employee_password]\r\n\r\nWorkforce Retention Employer/Employee Login Page;\r\nhttps://www.workforceretention.com.au/login\r\n\r\nPasswords and other User Profile detals can be changed by selecting 'Edit Profile' from the User Details menu.\r\n\r\nIf you have any problems with the site please do not hesitate to email us: enquiries@workforceretention.com.au\r\n\r\nAll the very best in your new endeavour!\r\n\r\nregards,\r\nWorkforce Retention"
};
// 2. InitialEmailTemplateTwo
exports.InitialEmailTemplateTwo = {
    email_type: 'template-two-email',
    editable: true,
    title: 'Initial Email - Template 2 (phone interview)',
    description: 'This is the initial email that is sent to the employee inviting them to complete an on-line exit interview. For Self-Administered systems.',
    from_address: 'enquiries@workforceretention.com.au',
    subject: "Sorry you're leaving [client_name]",
    body: "Hi [employee_firstname],\r\n\r\n[client_name] has partnered with Workforce Retention to conduct an exit interview with you, following your recent resignation.\r\n\r\nIt's really important for [client_name] to understand more about your experience, so they can address any perceived gaps and identify areas for improvement.\r\n\r\nWe will be in contact with you shortly to organise a phone based interview. Feel free to let us know a suitable day and time by replying to this email. We'll do our best to accommodate your preference. \r\n\r\nWant to get a head-start before we call you?\r\n\r\nIf you'd like to preview the interview ahead of time, you can log in to your interview via the details below. Otherwise, just wait for us to call you.\r\n\r\nTo access your exit interview, please use the details below:\r\n\r\nYour User Profile is;\r\n\r\nLogin Username: [employee_username]\r\nLogin Password: [employee_password]\r\n\r\nWorkforce Retention Employer/Employee Login Page;\r\nhttps://www.workforceretention.com.au/login\r\n\r\nPasswords and other User Profile detals can be changed by selecting Edit Profile from the User Details menu.\r\n\r\nIf you have any problems with the site please do not hesitate to email us: admin@workforceretention.com.au\r\n\r\nWe look forward to speaking with you soon\r\n\r\nregards,\r\nAngeline\r\nWorkforce Retention"
};
// 3. Reminder Email
exports.ReminderEmailTemplate = {
    email_type: 'reminder-email',
    editable: true,
    title: 'Reminder Email',
    description: 'This is the reminder email that is sent to employees registered who have not completed their exit interview. Outsourced Systems',
    from_address: 'enquiries@workforceretention.com.au',
    subject: "Don't forget your on-line exit interview!",
    body: "Hi [employee_firstname],\r\n\r\nJust a reminder to complete your on-line exit interview before you leave the business.\r\n\r\n[client_name] genuinely want to translate your feedback in constructive action that will make a difference to employees in the future.\r\n\r\nRemember, our process does not allow your personal responses to be disclosed to [client_name]. Once we have collated enough responses to ensure anonymity they will contribute to a comprehensive exit report for management.\r\n\r\nThank you for taking the time to complete your exit interview. It should only take between 5-20 minutes, depending on how much feedback you'd like to contribute.\r\n\r\nPlease use the Login Username and Password previously supplied to access the site. If you cannot remember your password, please email us at admin@workforceretention.com.au and we will reset your password. \r\n\r\nThanks in advance and all the best!\r\nWorkforce Retention"
};
// 4. Manager Reports Email
exports.InitialExitManagerReportEmailTemplate = {
    email_type: 'manager-report-email',
    editable: false,
    title: 'Manager Reports',
    description: 'This is the email script that is sent to managers who have been registered to view the online reports.',
    from_address: 'enquiries@workforceretention.com.au',
    subject: "Manager Login Details",
    body: "Hi [employee_firstname],\r\n\r\nYour details have been entered into the Workforce Retention Platform and you will soon be able to access exit interviews/reports for employees in your client group.\r\n\r\nYour User Profile is;\r\n\r\nLogin Username: [employee_username]\r\nLogin Password: [employee_password]\r\n\r\nWorkforce Retention Employer/Employee Login Page;\r\nhttps://www.workforceretention.com.au/login\r\n\r\nIf you have any problems with the site or need a psssword reset please do not hesitate to email us: admin@workforceretention.com.au\r\n\r\nregards,\r\nWorkforce Retention"
};
// ************** Client Email ***********

// *************** Below Email will sent when creating new client admin ***************
// 5. Client Admin Email
exports.UserEmailPasswordTemplate = {
    from_address: 'enquiries@workforceretention.com.au',
    editable: false,
    subject: "[Workforce Retention - Platform] New user notification",
    body: "Dear [user_firstname],\r\n\r\nYour details have been entered into the Workforce Retention Platform and you will soon able to access some administration functions. \n\nYour User Profile is;\n\nFull Name: [user_firstname] [user_lastname]\nEmail: [user_email]\nLogon Username: [user_username]\nLogon Password: [user_password]\n\nWorkforce Retention Web Office: https://www.workforceretention.com.au/auth/login\n\nIf you would like to have your password reset, please email us at : admin@workforceretention.com.au\n\nWarm wishes,\n\nAngeline\nWorkforce Retention"
};

exports.AdminReSetPasswordTemplate = {
    from_address: 'enquiries@workforceretention.com.au',
    editable: false,
    subject: "[Workforce Retention - Platform] Reset Password Link",
    body: '<p>You requested for reset password, kindly use this <a href="https://www.workforceretention.com.au/auth/reset-password?token=[token]">link</a> to reset your password</p>'
};


// *************** Below Email will be sent to user when new contact is submitted ***************
exports.ReplyContactEmailTemplate = {
    from_address: 'enquiries@workforceretention.com.au',
    subject: "Thanks for getting in touch",
    body: `
    Dear [name], <br><br>
    Thank you for getting in touch! <br><br>    
    One of our team will be in contact with you within the next 24 hours.<br><br>
    Hope you’re having a wonderful day. <br><br>    
    Warm wishes, <br><br>    
    <b>Angeline</b> <br>
    Director & Founder <br>
    Workforce Retention <br>
    P. +61 410 665 306 <br>
    <img src="https://workforceretention.s3-ap-southeast-2.amazonaws.com/assets/images/logo_no_space.png" style="height:100px;" height="100">
    `
};

// *************** Below Email will be sent to enquiries when new contact is submitted ***************
exports.ContactEmailTemplate = {
    to_address: checkEnv.isLiveServer ? 'enquiries@workforceretention.com.au' : 'sky930320@gmail.com',
    subject: "Received a New Message",
    body: `
    Name: [name] <br>
    Email: [email] <br>
    Organization: [organization] <br>
    Phone: [phone] <br> <br>
    "[message]"
    `
};



// *************** Below Email will be sent to user when new quotation is submitted ***************
exports.ReplyQuotationEmailTemplate = {
    from_address: 'enquiries@workforceretention.com.au',
    subject: "Thanks for submitting a quote request",
    body: `
    Dear [name], <br><br>
    Thank you for submitting a quote request! We value being flexible and adaptive. We’ll be in contact within 48 hours with information on how we can support your business along with an estimate of the cost, based on your preferences. <br><br>
    Hope you’re having a wonderful day. <br><br>
    Warm wishes, <br><br>
    <b>Angeline</b> <br>
    Director & Founder <br>
    Workforce Retention <br>
    P. +61 410 665 306 <br>
    <img src="https://workforceretention.s3-ap-southeast-2.amazonaws.com/assets/images/logo_no_space.png" style="height:100px;" height="100">
    `
};

// *************** Below Email will be sent to enquiries when new quotation is submitted ***************
exports.QuotationEmailTemplate = {
    to_address: checkEnv.isLiveServer ? 'enquiries@workforceretention.com.au' : 'sky930320@gmail.com',
    subject: "Received a Quotation",
    body: `
        <div style="margin-bottom: 10px;">
            Name: [name-val]
        </div>
        <div style="margin-bottom: 10px;">
            Position: [position-val]
        </div>
        <div style="margin-bottom: 10px;">
            Organisational Name: [org_name-val]
        </div>
        <div style="margin-bottom: 10px;">
            Email: [email-val]
        </div>
        <div style="margin-bottom: 10px;">
            Contact Number: [contact_number-val]
        </div>
        <div style="margin-bottom: 10px;">
            Workforce Size: [workforce_size-val]
        </div>
        <div style="margin-bottom: 40px;">
            Current Employee Turnover ( approx ): [cur_employee_turnover-val]
        </div>
        
        [license_required_status]
        [phone_interview_with_platform_status]
        [phone_interview_without_platform_status]
        [exit_report_status]
        [confidential]
    `
};

