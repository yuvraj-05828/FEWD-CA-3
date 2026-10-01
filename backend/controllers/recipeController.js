const Recipe = require('../models/Recipe');

// Helper to normalize ingredients from string or array to clean array of non-empty strings
const normalizeIngredients = (ingredients) => {
  if (Array.isArray(ingredients)) {
    return ingredients
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof ingredients === 'string') {
    return ingredients
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

// @desc    Get all recipes (with optional search and category filter)
// @route   GET /api/recipes
// @access  Public
const getRecipes = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (category && category.trim()) {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { ingredients: searchRegex },
      ];
    }

    const recipes = await Recipe.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single recipe by ID
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate(
      'createdBy',
      'name email role'
    );

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new recipe
// @route   POST /api/recipes
// @access  Private (JWT)
const createRecipe = async (req, res, next) => {
  try {
    const { title, ingredients, instructions, category, image } = req.body;

    const formattedIngredients = normalizeIngredients(ingredients);
    if (formattedIngredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['At least one valid ingredient is required'],
      });
    }

    const recipeData = {
      title: title.trim(),
      ingredients: formattedIngredients,
      instructions: instructions.trim(),
      category: category.trim().toLowerCase(),
      createdBy: req.user._id,
    };

    if (image && typeof image === 'string' && image.trim().length > 0) {
      recipeData.image = image.trim();
    }

    const createdRecipe = await Recipe.create(recipeData);
    const populatedRecipe = await Recipe.findById(createdRecipe._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: populatedRecipe,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a recipe
// @route   PUT /api/recipes/:id
// @access  Private (Creator or Admin)
const updateRecipe = async (req, res, next) => {
  try {
    // req.recipe is preloaded by authorizeRecipeOwnerOrAdmin middleware
    const recipe = req.recipe || (await Recipe.findById(req.params.id));

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    const { title, ingredients, instructions, category, image } = req.body;

    if (title !== undefined) recipe.title = title.trim();
    if (instructions !== undefined) recipe.instructions = instructions.trim();
    if (category !== undefined) recipe.category = category.trim().toLowerCase();
    if (image !== undefined) recipe.image = image.trim();
    if (ingredients !== undefined) {
      const formatted = normalizeIngredients(ingredients);
      if (formatted.length > 0) {
        recipe.ingredients = formatted;
      }
    }

    const updatedRecipe = await recipe.save();
    const populated = await Recipe.findById(updatedRecipe._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a recipe
// @route   DELETE /api/recipes/:id
// @access  Private (Creator or Admin)
const deleteRecipe = async (req, res, next) => {
  try {
    const recipe = req.recipe || (await Recipe.findById(req.params.id));

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  normalizeIngredients,
};
