/**
 * state.js - Centralized Client-Side Application State
 * Manages reactive state for products, filtering, sorting, and shopping cart persistence.
 */

const CART_STORAGE_KEY = 'shopping-cart';

/**
 * Application State
 */
export const state = {
  products: [],
  filteredProducts: [],
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  cart: []
};

/**
 * Safely loads persisted cart from localStorage.
 * Validates data integrity before hydrating state.
 */
export function loadCartFromStorage() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      state.cart = [];
      return;
    }

    const parsed = JSON.parse(rawCart);
    if (Array.isArray(parsed)) {
      // Validate that each item has at least id, price, and positive quantity
      state.cart = parsed.filter(item =>
        item &&
        typeof item.id !== 'undefined' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      );
    } else {
      state.cart = [];
    }
  } catch (error) {
    console.warn('Failed to parse cart from localStorage, initializing empty cart:', error);
    state.cart = [];
  }
}

/**
 * Persists current cart to localStorage.
 */
export function saveCartToStorage() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

/**
 * Sets the master products array and computes the initial filtered list.
 * @param {Array} products
 */
export function setProducts(products) {
  state.products = Array.isArray(products) ? [...products] : [];
  computeFilteredProducts();
}

/**
 * Updates the active category filter and recalculates filtered products.
 * @param {string} category
 */
export function setActiveCategory(category) {
  state.activeCategory = (category || 'all').toLowerCase();
  computeFilteredProducts();
}

/**
 * Updates the active search query and recalculates filtered products.
 * @param {string} query
 */
export function setSearchQuery(query) {
  state.searchQuery = (query || '').trim();
  computeFilteredProducts();
}

/**
 * Updates the active sort option and recalculates filtered products.
 * @param {string} sortBy
 */
export function setSortBy(sortBy) {
  state.sortBy = sortBy || 'default';
  computeFilteredProducts();
}

/**
 * Resets search query, category, and sort to default.
 */
export function resetFilters() {
  state.searchQuery = '';
  state.activeCategory = 'all';
  state.sortBy = 'default';
  computeFilteredProducts();
}

/**
 * Pure computation function that applies search filtering, category filtering,
 * and sorting without mutating the original state.products array.
 */
export function computeFilteredProducts() {
  let result = [...state.products];

  // 1. Apply category filter
  if (state.activeCategory && state.activeCategory !== 'all') {
    result = result.filter(item => {
      const itemCategory = (item.category || '').toLowerCase();
      return itemCategory === state.activeCategory;
    });
  }

  // 2. Apply real-time multi-field search filter (title, category, description)
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    result = result.filter(item => {
      const title = (item.title || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(q) || category.includes(q) || desc.includes(q);
    });
  }

  // 3. Apply sorting (client-side, non-mutating)
  switch (state.sortBy) {
    case 'price-low':
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      break;
    case 'price-high':
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      break;
    case 'rating-high':
      result.sort((a, b) => {
        const ratingA = a.rating && typeof a.rating.rate === 'number' ? a.rating.rate : 0;
        const ratingB = b.rating && typeof b.rating.rate === 'number' ? b.rating.rate : 0;
        return ratingB - ratingA;
      });
      break;
    case 'name-az':
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'default':
    default:
      // Preserve original API order (using id ascending or default array order)
      result.sort((a, b) => (a.id || 0) - (b.id || 0));
      break;
  }

  state.filteredProducts = result;
  return state.filteredProducts;
}

/**
 * Extracts a unique, sorted list of categories from the products list.
 * @returns {string[]}
 */
export function getAvailableCategories() {
  const set = new Set();
  state.products.forEach(p => {
    if (p.category) {
      set.add(p.category.toLowerCase());
    }
  });
  return ['all', ...Array.from(set).sort()];
}

/**
 * Adds a product to the cart.
 * If already in the cart, increases its quantity instead of duplicating.
 * @param {Object} product
 * @returns {Object} { item, isNew }
 */
export function addToCart(product) {
  if (!product || typeof product.id === 'undefined') return;

  const existingIndex = state.cart.findIndex(item => item.id === product.id);

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += 1;
    saveCartToStorage();
    return { item: state.cart[existingIndex], isNew: false };
  }

  const newCartItem = {
    id: product.id,
    title: product.title,
    price: Number(product.price) || 0,
    image: product.image,
    category: product.category,
    quantity: 1
  };

  state.cart.push(newCartItem);
  saveCartToStorage();
  return { item: newCartItem, isNew: true };
}

/**
 * Updates the quantity of an item in the cart by delta (+1 or -1).
 * If quantity drops to <= 0, the item is removed.
 * @param {number|string} productId
 * @param {number} delta
 */
export function updateCartQuantity(productId, delta) {
  const item = state.cart.find(i => String(i.id) === String(productId));
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCartToStorage();
  }
}

/**
 * Removes a product completely from the cart.
 * @param {number|string} productId
 */
export function removeFromCart(productId) {
  state.cart = state.cart.filter(item => String(item.id) !== String(productId));
  saveCartToStorage();
}

/**
 * Clears all items from the cart.
 */
export function clearCart() {
  state.cart = [];
  saveCartToStorage();
}

/**
 * Calculates the total item count and formatted total price.
 * @returns {{ totalCount: number, totalPrice: number, formattedPrice: string }}
 */
export function getCartTotals() {
  const totalCount = state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    totalCount,
    totalPrice: Math.round(totalPrice * 100) / 100,
    formattedPrice: `$${(Math.round(totalPrice * 100) / 100).toFixed(2)}`
  };
}
