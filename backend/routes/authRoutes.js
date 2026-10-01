const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
} = require('../validators/authValidator');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);

module.exports = router;
