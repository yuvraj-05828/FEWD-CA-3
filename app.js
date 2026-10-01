/**
 * COOK — Recipe Management Frontend Application
 * Communicates with Node.js/Express REST API endpoints
 */

// Configuration: API base URL (uses relative /api when hosted by Express)
const API_BASE = '/api';

// Application State
let currentUser = null;
let currentToken = null;
let currentRecipes = [];
let activeCategory = '';
let activeRecipeInModal = null;

// DOM Element References
const homeBtn = document.getElementById('home');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const searchClearBtn = document.getElementById('search-clear-btn');
const userInputHeader = document.getElementById('input');
const resultOutput = document.getElementById('output');
const randomMealCard = document.getElementById('random-card');
const categoryPills = document.querySelectorAll('.cat-pill');

// Auth DOM
const authGuestBar = document.getElementById('auth-guest');
const authLoggedInBar = document.getElementById('auth-logged-in');
const userNameDisplay = document.getElementById('user-name');
const btnLoginOpen = document.getElementById('btn-login-open');
const btnRegisterOpen = document.getElementById('btn-register-open');
const btnLogout = document.getElementById('btn-logout');
const authModal = document.getElementById('auth-modal');
const authModalClose = document.getElementById('auth-modal-close');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const linkToRegister = document.getElementById('link-to-register');
const linkToLogin = document.getElementById('link-to-login');

// Recipe Modals DOM
const recipeModal = document.getElementById('recipe-modal');
const recipeModalClose = document.getElementById('recipe-modal-close');
const btnCreateRecipeOpen = document.getElementById('btn-create-recipe-open');
const btnRecipeCancel = document.getElementById('btn-recipe-cancel');
const formRecipe = document.getElementById('form-recipe');
const recipeModalTitle = document.getElementById('recipe-modal-title');
const recipeFormId = document.getElementById('recipe-form-id');
const recipeTitleInput = document.getElementById('recipe-title');
const recipeCategoryInput = document.getElementById('recipe-category');
const recipeImageInput = document.getElementById('recipe-image');
const recipeIngredientsInput = document.getElementById('recipe-ingredients');
const recipeInstructionsInput = document.getElementById('recipe-instructions');
const recipeError = document.getElementById('recipe-error');

// Detail Modal DOM
const detailModal = document.getElementById('modal-1');
const detailModalClose = document.getElementById('modal-close');
const modalRecipeTitle = document.getElementById('modal-recipe-title');
const modalRecipeCategory = document.getElementById('modal-recipe-category');
const modalRecipeAuthor = document.getElementById('modal-recipe-author');
const modalRecipeImg = document.getElementById('modal-recipe-img');
const modalRecipeIngredients = document.getElementById('information');
const modalRecipeInstructions = document.getElementById('modal-recipe-instructions');
const modalOwnerActions = document.getElementById('modal-owner-actions');
const modalBtnEdit = document.getElementById('modal-btn-edit');
const modalBtnDelete = document.getElementById('modal-btn-delete');
const toastBanner = document.getElementById('toast-banner');

/* ==========================================================================
   Utility & Toast Functions
   ========================================================================== */

function showToast(message, type = 'success', duration = 3500) {
  if (!toastBanner) return;
  toastBanner.textContent = message;
  toastBanner.className = `toast-banner show toast-${type}`;

  setTimeout(() => {
    toastBanner.className = 'toast-banner';
  }, duration);
}

// Generic API fetch wrapper with token injection and error parsing
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        data.message ||
        (data.errors && data.errors.join(', ')) ||
        `Request failed with status ${response.status}`;
      return { ok: false, status: response.status, message: errorMsg, errors: data.errors };
    }

    return { ok: true, status: response.status, data };
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    return { ok: false, status: 0, message: 'Network error: could not connect to server' };
  }
}

/* ==========================================================================
   Authentication State & Handlers
   ========================================================================== */

function initAuth() {
  const savedToken = localStorage.getItem('cook_token');
  const savedUser = localStorage.getItem('cook_user');

  if (savedToken && savedUser) {
    currentToken = savedToken;
    try {
      currentUser = JSON.parse(savedUser);
    } catch {
      currentUser = null;
      currentToken = null;
      localStorage.removeItem('cook_token');
      localStorage.removeItem('cook_user');
    }
  }

  updateAuthUI();

  // Validate session with backend /api/auth/me
  if (currentToken) {
    apiFetch('/auth/me').then((result) => {
      if (!result.ok) {
        // Token expired or invalid
        handleLogout(false);
      } else {
        currentUser = result.data.data.user;
        localStorage.setItem('cook_user', JSON.stringify(currentUser));
        updateAuthUI();
      }
    });
  }
}

function updateAuthUI() {
  if (currentUser && currentToken) {
    authGuestBar.style.display = 'none';
    authLoggedInBar.style.display = 'flex';
    userNameDisplay.textContent = currentUser.name;
  } else {
    authGuestBar.style.display = 'flex';
    authLoggedInBar.style.display = 'none';
  }
}

function handleLoginSuccess(user, token) {
  currentUser = user;
  currentToken = token;
  localStorage.setItem('cook_token', token);
  localStorage.setItem('cook_user', JSON.stringify(user));
  updateAuthUI();
  closeModal(authModal);
  showToast(`Welcome back, ${user.name}!`, 'success');
  // Refresh recipes to update owner controls on cards
  fetchRecipes(searchInput.value, activeCategory);
}

function handleLogout(showNotification = true) {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem('cook_token');
  localStorage.removeItem('cook_user');
  updateAuthUI();
  if (showNotification) {
    showToast('Logged out successfully.', 'info');
  }
  // Re-fetch to update owner controls
  fetchRecipes(searchInput.value, activeCategory);
}

/* ==========================================================================
   Modal Controls
   ========================================================================== */

function openModal(modalElement) {
  if (modalElement) modalElement.style.display = 'block';
}

function closeModal(modalElement) {
  if (modalElement) modalElement.style.display = 'none';
}

function switchAuthTab(targetTab) {
  if (targetTab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'flex';
    formRegister.style.display = 'none';
    loginError.style.display = 'none';
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.style.display = 'flex';
    formLogin.style.display = 'none';
    registerError.style.display = 'none';
  }
}

/* ==========================================================================
   Recipe Management (CRUD & Search)
   ========================================================================== */

async function fetchRecipes(search = '', category = '') {
  resultOutput.innerHTML = '<div class="loading-spinner">Loading recipes from database...</div>';

  let queryString = '';
  const params = [];
  if (search.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
  if (category.trim()) params.push(`category=${encodeURIComponent(category.trim())}`);
  if (params.length > 0) queryString = `?${params.join('&')}`;

  const res = await apiFetch(`/recipes${queryString}`);

  if (!res.ok) {
    resultOutput.innerHTML = `<p style="color: #ff8b7b;">Failed to load recipes: ${res.message}</p>`;
    return;
  }

  currentRecipes = res.data.data || [];
  displaySearchResults(currentRecipes);
}

function displaySearchResults(recipes) {
  resultOutput.innerHTML = '';

  if (recipes.length === 0) {
    resultOutput.innerHTML = '<p>No recipes found matching your criteria. Try another search or add a recipe!</p>';
    return;
  }

  recipes.forEach((recipe) => {
    const isOwner =
      currentUser &&
      recipe.createdBy &&
      (recipe.createdBy._id === currentUser._id ||
        recipe.createdBy === currentUser._id ||
        currentUser.role === 'admin');

    const card = document.createElement('div');
    card.className = 'meal';
    card.setAttribute('data-id', recipe._id);

    const fallbackImg =
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';
    const creatorName = recipe.createdBy?.name || 'Chef';

    card.innerHTML = `
      <img class="meals" src="${recipe.image || fallbackImg}" alt="${recipe.title}" onerror="this.src='${fallbackImg}'">
      <div class="meal-content">
        <h3 class="meal-title">${recipe.title}</h3>
        <div class="meal-meta">
          <span class="badge-category">${recipe.category}</span>
          <span class="recipe-author-text">By ${creatorName}</span>
        </div>
      </div>
      ${
        isOwner
          ? `<div class="meal-card-actions">
               <button class="btn-card-action btn-card-edit" data-action="edit" title="Edit Recipe">✏️ Edit</button>
               <button class="btn-card-action btn-card-delete" data-action="delete" title="Delete Recipe">🗑️ Delete</button>
             </div>`
          : ''
      }
    `;

    // Click handler for card
    card.addEventListener('click', (e) => {
      // Ignore if user clicked edit or delete button directly
      if (e.target.dataset.action === 'edit') {
        e.stopPropagation();
        openEditRecipeModal(recipe);
        return;
      }
      if (e.target.dataset.action === 'delete') {
        e.stopPropagation();
        handleDeleteRecipe(recipe._id, recipe.title);
        return;
      }
      openRecipeDetails(recipe);
    });

    resultOutput.appendChild(card);
  });
}

// Fetch Random / Featured Recipe
async function fetchFeaturedMeal() {
  randomMealCard.innerHTML = '<div class="loading-spinner">Loading featured recipe...</div>';

  // 1. Try to fetch from backend recipes first
  const res = await apiFetch('/recipes');
  if (res.ok && res.data.data && res.data.data.length > 0) {
    const list = res.data.data;
    const randomRecipe = list[Math.floor(Math.random() * list.length)];
    renderFeaturedCard(randomRecipe);
    return;
  }

  // 2. Fallback to TheMealDB if database has no recipes yet
  try {
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    const data = await response.json();
    if (data.meals && data.meals[0]) {
      const meal = data.meals[0];
      const fallbackRecipe = {
        _id: null,
        title: meal.strMeal,
        image: meal.strMealThumb,
        category: meal.strCategory || 'Gourmet',
        createdBy: { name: 'TheMealDB Guest' },
        instructions: meal.strInstructions || 'No instructions provided.',
        ingredients: extractMealDbIngredients(meal),
      };
      renderFeaturedCard(fallbackRecipe);
    }
  } catch (err) {
    randomMealCard.innerHTML = '<p>Could not load featured meal.</p>';
  }
}

function extractMealDbIngredients(meal) {
  const ing = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      ing.push(measure ? `${measure.trim()} ${name.trim()}` : name.trim());
    }
  }
  return ing;
}

function renderFeaturedCard(recipe) {
  const fallbackImg =
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';
  randomMealCard.innerHTML = `
    <div class="meal" style="width: 320px; cursor: pointer;">
      <img class="meals" src="${recipe.image || fallbackImg}" alt="${recipe.title}" onerror="this.src='${fallbackImg}'">
      <div class="meal-content">
        <h3 class="meal-title">${recipe.title}</h3>
        <div class="meal-meta">
          <span class="badge-category">${recipe.category}</span>
          <span class="recipe-author-text">By ${recipe.createdBy?.name || 'Chef'}</span>
        </div>
      </div>
    </div>
  `;

  randomMealCard.querySelector('.meal').onclick = () => {
    openRecipeDetails(recipe);
  };
}

/* ==========================================================================
   Recipe Detail Modal View
   ========================================================================== */

function openRecipeDetails(recipe) {
  activeRecipeInModal = recipe;
  modalRecipeTitle.textContent = recipe.title;
  modalRecipeCategory.textContent = recipe.category;
  modalRecipeAuthor.textContent = `Created by: ${recipe.createdBy?.name || 'Chef'}`;
  modalRecipeImg.src =
    recipe.image ||
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';

  // Ingredients Box
  modalRecipeIngredients.innerHTML = '';
  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
    recipe.ingredients.forEach((item, index) => {
      const line = document.createElement('div');
      line.textContent = `${index + 1}. ${item}`;
      modalRecipeIngredients.appendChild(line);
    });
  } else {
    modalRecipeIngredients.textContent = 'No ingredients listed.';
  }

  // Instructions Box
  modalRecipeInstructions.textContent = recipe.instructions || 'No instructions provided.';

  // Owner action buttons visibility
  const isOwner =
    currentUser &&
    recipe.createdBy &&
    (recipe.createdBy._id === currentUser._id ||
      recipe.createdBy === currentUser._id ||
      currentUser.role === 'admin');

  if (isOwner && recipe._id) {
    modalOwnerActions.style.display = 'flex';
  } else {
    modalOwnerActions.style.display = 'none';
  }

  openModal(detailModal);
}

/* ==========================================================================
   Create & Edit Recipe Handlers
   ========================================================================== */

function openCreateRecipeModal() {
  if (!currentUser || !currentToken) {
    showToast('Please login to create a recipe.', 'error');
    openModal(authModal);
    switchAuthTab('login');
    return;
  }

  recipeModalTitle.textContent = 'Create New Recipe';
  recipeFormId.value = '';
  recipeTitleInput.value = '';
  recipeCategoryInput.value = 'pasta';
  recipeImageInput.value = '';
  recipeIngredientsInput.value = '';
  recipeInstructionsInput.value = '';
  recipeError.style.display = 'none';

  openModal(recipeModal);
}

function openEditRecipeModal(recipe) {
  if (!currentUser || !currentToken) {
    showToast('Please login first.', 'error');
    return;
  }

  recipeModalTitle.textContent = 'Edit Recipe';
  recipeFormId.value = recipe._id;
  recipeTitleInput.value = recipe.title || '';
  recipeCategoryInput.value = (recipe.category || 'pasta').toLowerCase();
  recipeImageInput.value = recipe.image || '';
  recipeIngredientsInput.value = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.join('\n')
    : recipe.ingredients || '';
  recipeInstructionsInput.value = recipe.instructions || '';
  recipeError.style.display = 'none';

  // Close detail modal if currently open
  closeModal(detailModal);
  openModal(recipeModal);
}

async function handleDeleteRecipe(recipeId, recipeTitle) {
  if (!confirm(`Are you sure you want to delete "${recipeTitle || 'this recipe'}"?`)) {
    return;
  }

  const res = await apiFetch(`/recipes/${recipeId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    showToast(res.message || 'Failed to delete recipe', 'error');
    return;
  }

  showToast('Recipe deleted successfully.', 'success');
  closeModal(detailModal);
  fetchRecipes(searchInput.value, activeCategory);
  fetchFeaturedMeal();
}

/* ==========================================================================
   Event Listeners & Wiring
   ========================================================================== */

// Search Button & Enter Key
searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  userInputHeader.textContent = query
    ? `Search Results for "${query}"`
    : activeCategory
    ? `Category: ${activeCategory.toUpperCase()}`
    : 'Our Gourmet Recipes';
  fetchRecipes(query, activeCategory);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  activeCategory = '';
  categoryPills.forEach((p) => p.classList.remove('active'));
  document.querySelector('.cat-pill[data-category=""]')?.classList.add('active');
  userInputHeader.textContent = 'Our Gourmet Recipes';
  fetchRecipes('', '');
});

// Category Filter Pills
categoryPills.forEach((pill) => {
  pill.addEventListener('click', (e) => {
    categoryPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.category || '';
    userInputHeader.textContent = activeCategory
      ? `Category: ${activeCategory.toUpperCase()}`
      : 'Our Gourmet Recipes';
    fetchRecipes(searchInput.value, activeCategory);
  });
});

// Navigation & Auth Buttons
homeBtn.addEventListener('click', () => {
  window.location.reload();
});

btnLoginOpen.addEventListener('click', () => {
  openModal(authModal);
  switchAuthTab('login');
});

btnRegisterOpen.addEventListener('click', () => {
  openModal(authModal);
  switchAuthTab('register');
});

btnLogout.addEventListener('click', () => {
  handleLogout(true);
});

tabLogin.addEventListener('click', () => switchAuthTab('login'));
tabRegister.addEventListener('click', () => switchAuthTab('register'));
linkToRegister.addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthTab('register');
});
linkToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthTab('login');
});

authModalClose.addEventListener('click', () => closeModal(authModal));
recipeModalClose.addEventListener('click', () => closeModal(recipeModal));
btnRecipeCancel.addEventListener('click', () => closeModal(recipeModal));
detailModalClose.addEventListener('click', () => closeModal(detailModal));

// Modal Outside Click Closes
window.addEventListener('click', (e) => {
  if (e.target === authModal) closeModal(authModal);
  if (e.target === recipeModal) closeModal(recipeModal);
  if (e.target === detailModal) closeModal(detailModal);
});

// Add Recipe button in header
btnCreateRecipeOpen.addEventListener('click', openCreateRecipeModal);

// Modal detail edit/delete triggers
modalBtnEdit.addEventListener('click', () => {
  if (activeRecipeInModal) {
    openEditRecipeModal(activeRecipeInModal);
  }
});

modalBtnDelete.addEventListener('click', () => {
  if (activeRecipeInModal && activeRecipeInModal._id) {
    handleDeleteRecipe(activeRecipeInModal._id, activeRecipeInModal.title);
  }
});

// Auth Form Submissions
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const submitBtn = document.getElementById('btn-login-submit');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Login';

  if (!res.ok) {
    loginError.textContent = res.message;
    loginError.style.display = 'block';
    return;
  }

  handleLoginSuccess(res.data.data.user, res.data.data.token);
});

formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.style.display = 'none';

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const submitBtn = document.getElementById('btn-register-submit');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Register';

  if (!res.ok) {
    registerError.textContent = res.message;
    registerError.style.display = 'block';
    return;
  }

  handleLoginSuccess(res.data.data.user, res.data.data.token);
});

// Recipe Form Submission (Create or Edit)
formRecipe.addEventListener('submit', async (e) => {
  e.preventDefault();
  recipeError.style.display = 'none';

  const id = recipeFormId.value;
  const title = recipeTitleInput.value.trim();
  const category = recipeCategoryInput.value.trim();
  const image = recipeImageInput.value.trim();
  const ingredientsRaw = recipeIngredientsInput.value;
  const instructions = recipeInstructionsInput.value.trim();
  const submitBtn = document.getElementById('btn-recipe-submit');

  // Format ingredients array
  const ingredients = ingredientsRaw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (ingredients.length === 0) {
    recipeError.textContent = 'Please enter at least one valid ingredient';
    recipeError.style.display = 'block';
    return;
  }

  const payload = { title, category, ingredients, instructions };
  if (image) payload.image = image;

  submitBtn.disabled = true;
  submitBtn.textContent = id ? 'Updating...' : 'Creating...';

  const endpoint = id ? `/recipes/${id}` : '/recipes';
  const method = id ? 'PUT' : 'POST';

  const res = await apiFetch(endpoint, {
    method,
    body: JSON.stringify(payload),
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Save Recipe';

  if (!res.ok) {
    recipeError.textContent = res.message;
    recipeError.style.display = 'block';
    return;
  }

  closeModal(recipeModal);
  showToast(id ? 'Recipe updated successfully!' : 'Recipe created successfully!', 'success');
  fetchRecipes(searchInput.value, activeCategory);
  fetchFeaturedMeal();
});

/* ==========================================================================
   Initialization on Load
   ========================================================================== */

window.addEventListener('DOMContentLoaded', () => {
  initAuth();
  fetchFeaturedMeal();
  fetchRecipes();
});
