'use strict';

const router = require('express').Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate, registerSchema, loginSchema, updateProfileSchema } = require('../middlewares/validation');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

module.exports = router;
