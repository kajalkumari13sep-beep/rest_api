/**
 * ui.js - Dynamic DOM Rendering & UI Presentation Logic
 * Handles product card generation, category tabs, cart drawer,
 * loading skeletons, empty states, error alerts, and toast notifications.
 */

// Helper to format currency
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `$${num.toFixed(2)}`;
}

// Helper to capitalize category names
export function formatCategoryName(cat) {
  if (!cat || cat === 'all') return 'All';
  return cat
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to generate star ratings representation
export function renderStars(ratingValue = 0) {
  const rounded = Math.round(ratingValue);
  const fullStars = '★'.repeat(Math.min(5, Math.max(0, rounded)));
  const emptyStars = '☆'.repeat(Math.max(0, 5 - rounded));
  return `${fullStars}${emptyStars}`;
}

/**
 * Creates a single product card element.
 * Follows semantic HTML structure with accessible attributes and lazy loading.
 * @param {Object} product
 * @returns {HTMLElement} <article class="product-card">
 */
export function createProductCard(product) {
  const article = document.createElement('article');
  article.className = 'product-card';
  article.setAttribute('data-id', product.id);
  article.setAttribute('tabindex', '0');

  const ratingScore = product.rating?.rate ?? 0;
  const ratingCount = product.rating?.count ?? 0;

  article.innerHTML = `
    <div class="product-card-media">
      <img
        src="${escapeHtml(product.image)}"
        alt="${escapeHtml(product.title)}"
        loading="lazy"
        width="260"
        height="260"
        onerror="this.onerror=null; this.src='https://placehold.co/260x260?text=Product+Image';"
      />
      <span class="category-badge">${escapeHtml(formatCategoryName(product.category))}</span>
    </div>
    <div class="product-card-body">
      <h3 class="product-title" title="${escapeHtml(product.title)}">
        ${escapeHtml(product.title)}
      </h3>
      <div class="product-rating" aria-label="Rating: ${ratingScore} out of 5 stars based on ${ratingCount} reviews">
        <span class="rating-stars" aria-hidden="true">${renderStars(ratingScore)}</span>
        <span class="rating-score">${ratingScore.toFixed(1)}</span>
        <span class="rating-count">(${ratingCount})</span>
      </div>
      <p class="product-description" title="${escapeHtml(product.description || '')}">
        ${escapeHtml(product.description || '')}
      </p>
      <div class="product-footer">
        <span class="product-price">${formatCurrency(product.price)}</span>
        <button
          type="button"
          class="btn btn-add-cart"
          data-action="add-to-cart"
          data-id="${product.id}"
          aria-label="Add ${escapeHtml(product.title)} to cart"
        >
          <svg class="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  `;

  return article;
}

/**
 * Renders the products grid using DocumentFragment for maximum DOM performance.
 * @param {HTMLElement} container - The container element (e.g. #productGrid)
 * @param {Array} products - List of products to render
 */
export function renderProducts(container, products) {
  if (!container) return;

  container.innerHTML = '';

  if (!products || products.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  products.forEach(product => {
    const card = createProductCard(product);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

/**
 * Renders loading skeleton cards inside the container.
 * @param {HTMLElement} container
 * @param {number} count
 */
export function renderSkeletonCards(container, count = 8) {
  if (!container) return;

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('article');
    skeleton.className = 'product-card skeleton-card';
    skeleton.setAttribute('aria-hidden', 'true');

    skeleton.innerHTML = `
      <div class="skeleton skeleton-media"></div>
      <div class="product-card-body">
        <div class="skeleton skeleton-badge"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-title short"></div>
        <div class="skeleton skeleton-rating"></div>
        <div class="product-footer">
          <div class="skeleton skeleton-price"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    `;

    fragment.appendChild(skeleton);
  }

  container.appendChild(fragment);
}

/**
 * Renders dynamic category filter tab buttons.
 * @param {HTMLElement} container - The tabs container
 * @param {string[]} categories - Available categories
 * @param {string} activeCategory - Currently selected category
 */
export function renderCategories(container, categories, activeCategory = 'all') {
  if (!container) return;

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  categories.forEach(cat => {
    const isActive = cat.toLowerCase() === activeCategory.toLowerCase();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `category-tab ${isActive ? 'active' : ''}`;
    button.setAttribute('data-category', cat);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    button.textContent = formatCategoryName(cat);

    fragment.appendChild(button);
  });

  container.appendChild(fragment);
}

/**
 * Renders the empty search/filter state when no products match.
 * @param {HTMLElement} container
 * @param {string} searchQuery
 * @param {string} activeCategory
 * @param {Function} [onReset] - Callback to clear filters
 */
export function renderEmptyState(container, searchQuery, activeCategory) {
  if (!container) return;

  const hasSearch = Boolean(searchQuery && searchQuery.trim());
  const hasCategory = activeCategory && activeCategory !== 'all';

  let contextMsg = 'Try another search term or category.';
  if (hasSearch && hasCategory) {
    contextMsg = `No products found matching "${escapeHtml(searchQuery)}" in "${escapeHtml(formatCategoryName(activeCategory))}".`;
  } else if (hasSearch) {
    contextMsg = `No products found matching "${escapeHtml(searchQuery)}".`;
  } else if (hasCategory) {
    contextMsg = `No products currently available in "${escapeHtml(formatCategoryName(activeCategory))}".`;
  }

  container.innerHTML = `
    <div class="empty-state" role="status">
      <div class="empty-state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </div>
      <h3 class="empty-state-title">No products found</h3>
      <p class="empty-state-desc">${contextMsg} Try adjusting your keywords or clearing active filters.</p>
      <button type="button" class="btn btn-primary" id="btnResetFilters">
        Reset Filters
      </button>
    </div>
  `;
}

/**
 * Displays user-friendly error banner with retry option.
 * @param {HTMLElement} bannerElement
 * @param {string} message
 * @param {Function} [retryHandler]
 */
export function renderError(bannerElement, message, retryHandler) {
  if (!bannerElement) return;

  bannerElement.hidden = false;
  bannerElement.innerHTML = `
    <div class="error-banner-content">
      <div class="error-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="error-message">
        <strong>Unable to load products</strong>
        <p>${escapeHtml(message || 'Please check your internet connection and try again.')}</p>
      </div>
      <button type="button" class="btn btn-retry" id="btnRetry">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M23 4v6h-6"></path>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Retry</span>
      </button>
    </div>
  `;

  if (retryHandler) {
    const btnRetry = bannerElement.querySelector('#btnRetry');
    if (btnRetry) {
      btnRetry.addEventListener('click', retryHandler, { once: true });
    }
  }
}

/**
 * Hides the error banner.
 * @param {HTMLElement} bannerElement
 */
export function hideError(bannerElement) {
  if (!bannerElement) return;
  bannerElement.hidden = true;
  bannerElement.innerHTML = '';
}

/**
 * Updates the shopping cart badge counter in the header.
 * @param {HTMLElement} badgeElement
 * @param {number} totalCount
 */
export function updateCartBadge(badgeElement, totalCount) {
  if (!badgeElement) return;

  badgeElement.textContent = totalCount;
  badgeElement.setAttribute('aria-label', `${totalCount} items in cart`);

  if (totalCount > 0) {
    badgeElement.classList.add('has-items');
    // Pop animation
    badgeElement.classList.remove('badge-pop');
    void badgeElement.offsetWidth; // Trigger reflow
    badgeElement.classList.add('badge-pop');
  } else {
    badgeElement.classList.remove('has-items');
  }
}

/**
 * Renders the cart drawer contents (items, totals, and empty state).
 * @param {HTMLElement} drawerElement
 * @param {Array} cartItems
 * @param {Object} totals
 */
export function renderCart(drawerElement, cartItems, totals) {
  if (!drawerElement) return;

  const itemsContainer = drawerElement.querySelector('#cartItemsContainer');
  const footerContainer = drawerElement.querySelector('#cartFooter');
  const emptyStateContainer = drawerElement.querySelector('#cartEmptyState');
  const countBadge = drawerElement.querySelector('#cartHeaderCount');
  const totalPriceElement = drawerElement.querySelector('#cartTotalPrice');

  if (countBadge) {
    countBadge.textContent = `(${totals.totalCount} ${totals.totalCount === 1 ? 'item' : 'items'})`;
  }

  if (totalPriceElement) {
    totalPriceElement.textContent = totals.formattedPrice;
  }

  if (!cartItems || cartItems.length === 0) {
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (emptyStateContainer) emptyStateContainer.hidden = false;
    if (footerContainer) footerContainer.hidden = true;
    return;
  }

  if (emptyStateContainer) emptyStateContainer.hidden = true;
  if (footerContainer) footerContainer.hidden = false;

  if (itemsContainer) {
    itemsContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    cartItems.forEach(item => {
      const lineTotal = formatCurrency(item.price * item.quantity);
      const article = document.createElement('article');
      article.className = 'cart-item';
      article.setAttribute('data-id', item.id);

      article.innerHTML = `
        <img
          class="cart-item-image"
          src="${escapeHtml(item.image)}"
          alt="${escapeHtml(item.title)}"
          width="64"
          height="64"
          loading="lazy"
          onerror="this.onerror=null; this.src='https://placehold.co/64x64?text=Item';"
        />
        <div class="cart-item-details">
          <h4 class="cart-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h4>
          <span class="cart-item-unit-price">${formatCurrency(item.price)} each</span>
          <div class="cart-item-actions">
            <div class="quantity-stepper" role="group" aria-label="Quantity for ${escapeHtml(item.title)}">
              <button
                type="button"
                class="btn-qty btn-qty-decrease"
                data-action="decrease-qty"
                data-id="${item.id}"
                aria-label="Decrease quantity"
              >–</button>
              <span class="cart-item-qty" aria-live="polite">${item.quantity}</span>
              <button
                type="button"
                class="btn-qty btn-qty-increase"
                data-action="increase-qty"
                data-id="${item.id}"
                aria-label="Increase quantity"
              >+</button>
            </div>
            <span class="cart-item-line-total">${lineTotal}</span>
          </div>
        </div>
        <button
          type="button"
          class="btn-remove-item"
          data-action="remove-item"
          data-id="${item.id}"
          title="Remove product"
          aria-label="Remove ${escapeHtml(item.title)} from cart"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      `;

      fragment.appendChild(article);
    });

    itemsContainer.appendChild(fragment);
  }
}

/**
 * Updates the search & category result count indicator.
 * @param {HTMLElement} countElement
 * @param {number} count
 * @param {number} total
 */
export function updateResultsCount(countElement, count, total) {
  if (!countElement) return;

  if (count === total) {
    countElement.textContent = `Showing all ${total} products`;
  } else {
    countElement.textContent = `Showing ${count} of ${total} products`;
  }
}

/**
 * Shows a lightweight floating toast notification.
 * @param {string} message
 * @param {'success'|'info'|'warning'} [type='success']
 * @param {number} [duration=3000]
 */
export function showToast(message, type = 'success', duration = 2800) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.role = 'status';

  const iconSvg = type === 'success'
    ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${iconSvg}</span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  }, duration);
}

/**
 * Escapes unsafe characters for safe innerHTML injection.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
