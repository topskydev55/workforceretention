const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

//THIS ROUTE WILL GENERATE A TOKEN ALSO GENERATE A REFRESH TOKEN
router.post('/login', authController.login);

//THIS ROUTE WILL EMAIL RESET-PASWWORD LINK WITH TOKEN
router.post('/request-pass', authController.requestPass);

//THIS ROUTE WILL RESET PASSWORD
router.put('/reset-pass', authController.resetPass);

//THIS ROUTE WILL USE TO GENERATE A NEW TOKEN
router.post('/token', authController.token);

//THIS ROUTE WILL USE TO DESTROY A GENERATED TOKEN
router.post('/logout', authController.logout);


module.exports = router;