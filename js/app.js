/**
 * app.js - Main Application Orchestrator
 * Coordinates REST API fetching, centralized state, UI rendering,
 * event listeners, accessibility workflows, and user feedback.
 */

import { fetchProducts, clearProductsCache } from './api.js';
import {
  state,
  loadCartFromStorage,
  setProducts,
  setActiveCategory,
  setSearchQuery,
  setSortBy,
  resetFilters,
  getAvailableCategories,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartTotals
} from './state.js';
import {
  renderProducts,
  renderCategories,
  renderSkeletonCards,
  renderEmptyState,
  renderError,
  hideError,
  updateCartBadge,
  renderCart,
  updateResultsCount,
  showToast
} from './ui.js';

// DOM Elements Cache
const dom = {
  productGrid: document.getElementById('productGrid'),
  categoryTabs: document.getElementById('categoryTabs'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  sortSelect: document.getElementById('sortSelect'),
  resultsCount: document.getElementById('resultsCount'),
  errorBanner: document.getElementById('errorBanner'),
  // Cart elements
  cartTriggerBtn: document.getElementById('cartTriggerBtn'),
  cartBadge: document.getElementById('cartBadge'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartBackdrop: document.getElementById('cartBackdrop'),
  closeCartBtn: document.getElementById('closeCartBtn'),
  clearCartBtn: document.getElementById('clearCartBtn'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  continueShoppingBtn: document.getElementById('continueShoppingBtn')
};

// Debounce timer for smooth real-time search
let searchDebounceTimer = null;

/**
 * Initializes the application flow upon DOM ready.
 */
async function initApp() {
  // 1. Restore persisted cart from localStorage
  loadCartFromStorage();
  refreshCartUI();

  // 2. Attach interactive event listeners
  setupEventListeners();

  // 3. Load product data from REST API
  await loadProducts();
}

/**
 * Loads products from API, manages skeletons, updates state, and renders views.
 * @param {boolean} [forceRefresh=false]
 */
async function loadProducts(forceRefresh = false) {
  hideError(dom.errorBanner);
  renderSkeletonCards(dom.productGrid, 8);

  try {
    const products = await fetchProducts({ forceRefresh });

    // Store products in state (automatically computes initial filteredProducts)
    setProducts(products);

    // Dynamically generate category tabs from API data
    const categories = getAvailableCategories();
    renderCategories(dom.categoryTabs, categories, state.activeCategory);

    // Render product cards and results counter
    refreshProductsView();
  } catch (error) {
    console.error('Failed to load products:', error);
    if (dom.productGrid) dom.productGrid.innerHTML = '';
    renderError(
      dom.errorBanner,
      error.message || 'Unable to load products. Please check your internet connection and try again.',
      () => loadProducts(true)
    );
  }
}

/**
 * Re-renders the products grid, empty state, and results count based on state.
 */
function refreshProductsView() {
  if (state.filteredProducts.length === 0) {
    renderEmptyState(dom.productGrid, state.searchQuery, state.activeCategory);
    updateResultsCount(dom.resultsCount, 0, state.products.length);
  } else {
    renderProducts(dom.productGrid, state.filteredProducts);
    updateResultsCount(dom.resultsCount, state.filteredProducts.length, state.products.length);
  }
}

/**
 * Synchronizes the cart drawer and header badge with the current cart state.
 */
function refreshCartUI() {
  const totals = getCartTotals();
  updateCartBadge(dom.cartBadge, totals.totalCount);
  renderCart(dom.cartDrawer, state.cart, totals);
}

/**
 * Registers all application event listeners using clean event delegation.
 */
function setupEventListeners() {
  // --- Real-time Search Input with Debouncing ---
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', e => {
      const query = e.target.value;

      // Show/hide clear search button
      if (dom.clearSearchBtn) {
        dom.clearSearchBtn.hidden = !query;
      }

      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        setSearchQuery(query);
        refreshProductsView();
      }, 150);
    });

    dom.searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape' && dom.searchInput.value) {
        clearSearch();
      }
    });
  }

  // Clear search button click
  if (dom.clearSearchBtn) {
    dom.clearSearchBtn.addEventListener('click', clearSearch);
  }

  // --- Category Tabs Selection (Delegated) ---
  if (dom.categoryTabs) {
    dom.categoryTabs.addEventListener('click', e => {
      const button = e.target.closest('.category-tab');
      if (!button) return;

      const selectedCategory = button.getAttribute('data-category');
      if (!selectedCategory || selectedCategory.toLowerCase() === state.activeCategory) {
        return;
      }

      setActiveCategory(selectedCategory);

      // Re-render categories to update active state/aria-pressed
      const categories = getAvailableCategories();
      renderCategories(dom.categoryTabs, categories, state.activeCategory);

      // Refresh product grid
      refreshProductsView();
    });
  }

  // --- Sorting Selection ---
  if (dom.sortSelect) {
    dom.sortSelect.addEventListener('change', e => {
      setSortBy(e.target.value);
      refreshProductsView();
    });
  }

  // --- Product Grid Event Delegation (Add to Cart & Empty Reset) ---
  if (dom.productGrid) {
    dom.productGrid.addEventListener('click', e => {
      // 1. Add to Cart action
      const addBtn = e.target.closest('[data-action="add-to-cart"]');
      if (addBtn) {
        const productId = addBtn.getAttribute('data-id');
        const product = state.products.find(p => String(p.id) === String(productId));

        if (product) {
          const result = addToCart(product);
          refreshCartUI();

          const toastMessage = result.isNew
            ? `Added "${product.title}" to cart!`
            : `Updated quantity for "${product.title}" in cart.`;

          showToast(toastMessage, 'success');
        }
        return;
      }

      // 2. Empty State Reset Filters action
      const resetBtn = e.target.closest('#btnResetFilters');
      if (resetBtn) {
        handleResetFilters();
      }
    });
  }

  // --- Cart Drawer Open / Close / Toggle ---
  if (dom.cartTriggerBtn) {
    dom.cartTriggerBtn.addEventListener('click', openCartDrawer);
  }

  if (dom.closeCartBtn) {
    dom.closeCartBtn.addEventListener('click', closeCartDrawer);
  }

  if (dom.cartBackdrop) {
    dom.cartBackdrop.addEventListener('click', closeCartDrawer);
  }

  if (dom.continueShoppingBtn) {
    dom.continueShoppingBtn.addEventListener('click', closeCartDrawer);
  }

  // Keyboard accessibility: ESC key closes drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isCartDrawerOpen()) {
      closeCartDrawer();
    }
  });

  // --- Cart Drawer Item Controls (Delegated) ---
  if (dom.cartDrawer) {
    dom.cartDrawer.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const productId = target.getAttribute('data-id');

      switch (action) {
        case 'increase-qty':
          updateCartQuantity(productId, 1);
          refreshCartUI();
          break;

        case 'decrease-qty':
          updateCartQuantity(productId, -1);
          refreshCartUI();
          break;

        case 'remove-item':
          removeFromCart(productId);
          refreshCartUI();
          showToast('Item removed from cart.', 'info');
          break;

        default:
          break;
      }
    });
  }

  // Clear entire cart
  if (dom.clearCartBtn) {
    dom.clearCartBtn.addEventListener('click', () => {
      if (state.cart.length === 0) return;
      if (window.confirm('Are you sure you want to clear your shopping cart?')) {
        clearCart();
        refreshCartUI();
        showToast('Shopping cart cleared.', 'info');
      }
    });
  }

  // Simulated Checkout
  if (dom.checkoutBtn) {
    dom.checkoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) return;
      const totals = getCartTotals();
      clearCart();
      refreshCartUI();
      closeCartDrawer();
      showToast(`Order placed successfully! Total: ${totals.formattedPrice}`, 'success', 4000);
    });
  }

  // Network offline / online handling
  window.addEventListener('online', () => {
    showToast('Internet connection restored.', 'success');
    if (state.products.length === 0) {
      loadProducts();
    }
  });

  window.addEventListener('offline', () => {
    showToast('You are currently offline.', 'warning');
  });
}

/**
 * Clears search input and updates views.
 */
function clearSearch() {
  if (dom.searchInput) {
    dom.searchInput.value = '';
    dom.searchInput.focus();
  }
  if (dom.clearSearchBtn) {
    dom.clearSearchBtn.hidden = true;
  }
  setSearchQuery('');
  refreshProductsView();
}

/**
 * Resets all search, category, and sorting filters.
 */
function handleResetFilters() {
  resetFilters();

  if (dom.searchInput) {
    dom.searchInput.value = '';
  }
  if (dom.clearSearchBtn) {
    dom.clearSearchBtn.hidden = true;
  }
  if (dom.sortSelect) {
    dom.sortSelect.value = 'default';
  }

  // Re-render category tabs to reflect "All"
  const categories = getAvailableCategories();
  renderCategories(dom.categoryTabs, categories, 'all');

  refreshProductsView();
}

/**
 * Opens the shopping cart drawer with accessible attributes and focus management.
 */
function openCartDrawer() {
  if (!dom.cartDrawer || !dom.cartBackdrop) return;

  dom.cartDrawer.classList.add('open');
  dom.cartDrawer.setAttribute('aria-hidden', 'false');
  dom.cartBackdrop.classList.add('open');
  document.body.classList.add('drawer-open');

  if (dom.closeCartBtn) {
    dom.closeCartBtn.focus();
  }
}

/**
 * Closes the shopping cart drawer.
 */
function closeCartDrawer() {
  if (!dom.cartDrawer || !dom.cartBackdrop) return;

  dom.cartDrawer.classList.remove('open');
  dom.cartDrawer.setAttribute('aria-hidden', 'true');
  dom.cartBackdrop.classList.remove('open');
  document.body.classList.remove('drawer-open');

  if (dom.cartTriggerBtn) {
    dom.cartTriggerBtn.focus();
  }
}

/**
 * Checks if the cart drawer is open.
 * @returns {boolean}
 */
function isCartDrawerOpen() {
  return dom.cartDrawer && dom.cartDrawer.classList.contains('open');
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
