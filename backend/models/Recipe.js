const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
      maxlength: [120, 'Recipe title cannot exceed 120 characters'],
    },
    ingredients: {
      type: [String],
      required: [true, 'At least one ingredient is required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0 && val.some((item) => item.trim().length > 0);
        },
        message: 'Recipe must have at least one non-empty ingredient',
      },
    },
    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipe creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-performance querying and filtering
recipeSchema.index({ title: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ createdBy: 1 });
recipeSchema.index({ title: 'text', category: 'text', instructions: 'text' });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
