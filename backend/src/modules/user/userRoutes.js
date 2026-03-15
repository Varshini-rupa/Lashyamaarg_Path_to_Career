const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, getProfile, forgotPassword, resetPassword, updateProfile } = require('./userController');
const authMiddleware = require('../../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);

module.exports = router;
