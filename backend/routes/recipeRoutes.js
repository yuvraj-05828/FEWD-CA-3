const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require('../controllers/recipeController');
const {
  createRecipeValidation,
  updateRecipeValidation,
  validateRecipeId,
} = require('../validators/recipeValidator');
const {
  protect,
  authorizeRecipeOwnerOrAdmin,
} = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getRecipes)
  .post(protect, createRecipeValidation, createRecipe);

router
  .route('/:id')
  .get(validateRecipeId, getRecipeById)
  .put(protect, updateRecipeValidation, authorizeRecipeOwnerOrAdmin, updateRecipe)
  .delete(protect, validateRecipeId, authorizeRecipeOwnerOrAdmin, deleteRecipe);

module.exports = router;
