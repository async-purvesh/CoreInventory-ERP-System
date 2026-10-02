const express = require('express')
const authController = require('../controller/auth.controller')
const identifyUser = require('../middleware/auth.middleware')
const authRoute = express.Router()

authRoute.post('/register' , authController.registerUser)
authRoute.post('/login' , authController.loginUser)
authRoute.get('/me', identifyUser, authController.getMe)
authRoute.put('/me', identifyUser, authController.updateMe)

module.exports = authRoute