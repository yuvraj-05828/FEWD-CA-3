const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const { handleValidationErrors } = require('./authValidator');

// Helper custom sanitizer/validator for ingredients
const validateIngredients = (val) => {
  if (Array.isArray(val)) {
    return val.length > 0 && val.some((item) => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof val === 'string') {
    return val.trim().length > 0;
  }
  return false;
};

const createRecipeValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Recipe title is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Title must be between 2 and 120 characters'),
  body('ingredients')
    .custom(validateIngredients)
    .withMessage('Ingredients are required (at least one non-empty ingredient)'),
  body('instructions')
    .trim()
    .notEmpty()
    .withMessage('Instructions are required'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('image')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Image must be a valid string URL'),
  handleValidationErrors,
];

const updateRecipeValidation = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid recipe ID format'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Recipe title cannot be empty')
    .isLength({ min: 2, max: 120 })
    .withMessage('Title must be between 2 and 120 characters'),
  body('ingredients')
    .optional()
    .custom(validateIngredients)
    .withMessage('Ingredients must contain at least one non-empty item'),
  body('instructions')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Instructions cannot be empty'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a valid string URL'),
  handleValidationErrors,
];

const validateRecipeId = [
  param('id')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid recipe ID format'),
  handleValidationErrors,
];

module.exports = {
  createRecipeValidation,
  updateRecipeValidation,
  validateRecipeId,
};
