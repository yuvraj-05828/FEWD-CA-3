const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Recipe = require('../models/Recipe');

// Middleware to verify JWT token and attach user to req
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'cook_jwt_secret_dev_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired',
    });
  }
};

// Middleware to authorize creator or admin for recipe modifications
const authorizeRecipeOwnerOrAdmin = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    const isCreator = recipe.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to modify or delete this recipe',
      });
    }

    // Attach recipe to request for downstream controller efficiency
    req.recipe = recipe;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorizeRecipeOwnerOrAdmin,
};
