# Dynamic JavaScript DOM Logic & RESTful API Client

A responsive, high-performance e-commerce catalog and shopping cart web application built with **semantic HTML5, modern CSS3, and vanilla ES6+ JavaScript modules**.

This project demonstrates clean frontend architecture, asynchronous REST API integration with `fetch` and `async/await`, centralized client-side state management, resilient local caching with `localStorage`, and accessible dynamic DOM manipulation.

---

## 📌 Project Overview

This project showcases core modern web development practices without relying on external UI frameworks or heavy libraries:

* **REST API Integration:** Asynchronous communication with [Fake Store API](https://fakestoreapi.com/) using `fetch()` and `async/await`.
* **Async JavaScript:** Robust error boundaries, retry logic, and network failure detection.
* **Dynamic DOM Manipulation:** Efficient, batch-rendered UI using `document.createElement()` and `DocumentFragment`.
* **Real-Time Search:** Instant filtering across title, category, and description with debounced input.
* **Category Filtering:** Dynamic extraction and rendering of categories with accessible active states.
* **Client-Side Sorting:** Multi-criteria sorting (Price Low/High, Rating, Alphabetical) without mutating source data.
* **State Management:** Centralized reactive state store managing product catalogs, filters, and shopping cart.
* **LocalStorage Persistence:** Full cart persistence and optional TTL API caching surviving page refreshes.
* **Loading States:** Shimmering animated CSS skeletons during API fetching.
* **Error Handling:** Graceful error alerts with one-click retry mechanisms.
* **Accessibility (a11y):** WCAG 2.1 AA compliance with semantic landmarks, keyboard navigation, focus management, and `aria-live` announcements.

---

## 🛠 Technologies

* **HTML5:** Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`), dialog roles, and accessible labels.
* **CSS3:** Responsive CSS Grid (`repeat(4, 1fr)` down to single column), Flexbox, CSS Custom Properties (Design Tokens), Glassmorphism, and `@keyframes` animations.
* **JavaScript (ES6+ Modules):** Native `import` / `export`, arrow functions, destructuring, template literals, optional chaining, and event delegation.
* **REST API:** Fake Store API (`https://fakestoreapi.com/products`).
* **Fetch API & Async/Await:** Modern promise-based network requests with HTTP status validation.
* **Web Storage API:** `localStorage` for cross-session cart preservation and client-side data caching.

---

## ✨ Features

### 1. RESTful API Integration
* Fetches live store catalog from `https://fakestoreapi.com/products`.
* Strict HTTP response verification (`response.ok`).
* Differentiates network drops (offline/DNS) from HTTP server errors.
* 10-minute client-side TTL caching in `localStorage` to reduce redundant network roundtrips, with cache bypass on manual retry.
* Decoupled network layer with zero page reloads.

### 2. Dynamic DOM Rendering
* Cards dynamically generated using `DocumentFragment` to eliminate layout thrashing.
* Displays product image (with lazy loading and placeholder fallback), title, category tag, star rating (`★` / `☆`), review count, formatted price, and accessible "Add to Cart" button.
* Zero hardcoded products in the HTML markup.

### 3. Real-Time Search
* Live search input with instant filtering across:
  * **Product Title**
  * **Category**
  * **Product Description**
* 150ms debounced input for silky smooth typing performance.
* One-click clear search button and keyboard `Escape` dismissal.

### 4. Dynamic Category Tabs
* Categories extracted dynamically from the API response (e.g. *All*, *Electronics*, *Jewelery*, *Men's Clothing*, *Women's Clothing*).
* Visual indicator and `aria-pressed` toggle for the active tab.
* Horizontal scrollable navigation on mobile viewports.

### 5. Multi-Criteria Sorting
* Client-side sorting dropdown:
  * **Default / Featured:** Original catalog sequence.
  * **Price: Low to High:** Ascending price order.
  * **Price: High to Low:** Descending price order.
  * **Rating: High to Low:** Best-rated products first.
  * **Name: A-Z:** Alphabetical order by title.
* Completely non-destructive: master product data remains immutable.

### 6. Client-Side State Management (`js/state.js`)
* Centralized state object:
  ```javascript
  const state = {
    products: [],
    filteredProducts: [],
    activeCategory: "all",
    searchQuery: "",
    sortBy: "default",
    cart: []
  };
  ```
* Pure transformation pipeline combining search, category, and sorting.

### 7. Shopping Cart with LocalStorage Persistence
* Slide-out cart drawer with smooth transition and backdrop overlay.
* Live item counter badge in the header with bounce animation.
* Cart controls:
  * Add to cart (automatically increments quantity for existing items).
  * Quantity increment (`+`) and decrement (`-`).
  * Instant item removal with trash icon.
  * Clear cart button with confirmation modal.
  * Calculated line item total and overall order subtotal formatted to 2 decimal places.
  * Simulated checkout with instant toast notification.
* Cart state automatically preserved across browser restarts and page refreshes.

### 8. Loading Skeletons
* 8 responsive skeleton cards rendered immediately upon app initialization.
* CSS gradient shimmer animation mimicking product media, badges, titles, and buttons.
* Seamlessly replaced when products finish loading or when an error occurs.

### 9. Resilient Error Handling & Offline Support
* User-friendly error alert (`role="alert"`, `aria-live="assertive"`).
* Informative message without exposing internal stack traces.
* "Retry" button that bypasses cache and re-fetches from the API.
* Online/offline event listeners informing user of connectivity changes via floating toasts.

### 10. Empty Search Results
* Friendly empty state graphic displayed when no products match the current filters.
* "Reset Filters" action button immediately clears search and restores the full catalog.

---

## 🌐 Public API

This project connects to the **Fake Store API**:
* Endpoint: `https://fakestoreapi.com/products`
* Data format: JSON array containing product objects (`id`, `title`, `price`, `description`, `category`, `image`, `rating`).

---

## 📂 Project Structure

```text
dynamic-js-api-client/
├── index.html              # Semantic HTML5 layout, accessible dialogs & live regions
├── README.md               # Documentation, features, and setup guide
├── assets/
│   └── favicon.svg         # SVG brand favicon
├── css/
│   └── style.css           # Responsive design system, CSS Grid, skeletons & drawer
└── js/
    ├── api.js              # REST API client with async/await, error handling & caching
    ├── state.js            # Single source of truth: reactive state, cart & filter pipeline
    ├── ui.js               # Pure DOM rendering, DocumentFragment batching, skeletons & toasts
    └── app.js              # Application coordinator, lifecycle manager & event delegation
```

### Module Responsibilities

1. **`js/api.js`**: Pure network layer. Handles `fetch()`, HTTP error checking (`response.ok`), network exceptions, and TTL caching. Completely decoupled from the DOM.
2. **`js/state.js`**: Application data model. Manages immutable source arrays, computes filtered and sorted subsets, executes cart logic (add/increment/decrement/remove), and handles `localStorage` synchronization.
3. **`js/ui.js`**: Pure presentation layer. Builds DOM nodes, handles batch insertions via `DocumentFragment`, renders category tabs, skeletons, cart items, empty states, error alerts, and toast notifications.
4. **`js/app.js`**: Application controller. Initializes state, hydrates storage, coordinates data loading, manages event delegation, handles keyboard navigation, and drives UI updates.

---

## 🚀 How to Run Locally

Because the application uses native **JavaScript ES6 Modules** (`import` / `export`), modern browsers enforce CORS security policies that disallow loading modules directly over the `file://` protocol. The application must be served over `http://` or `https://`.

### Option 1: VS Code Live Server (Recommended)
1. Open the `dynamic-js-api-client` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and choose **"Open with Live Server"** (or click "Go Live" in the status bar).
4. The application opens automatically at `http://127.0.0.1:5500/index.html`.

### Option 2: Python HTTP Server (Zero Install)
If you have Python installed:

**Python 3:**
```bash
cd dynamic-js-api-client
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 3: Node.js `npx serve`
If you have Node.js installed:
```bash
cd dynamic-js-api-client
npx serve .
```
Open the provided local URL (typically [http://localhost:3000](http://localhost:3000)).

---

## 📸 Screenshots

### 1. Main Dashboard & Product Catalog
> *Placeholder: Add screenshot of desktop 4-column catalog layout with active category tabs and header.*
>
> `![Main Catalog](assets/screenshots/main-catalog.png)`

### 2. Real-Time Search & Category Filtering
> *Placeholder: Add screenshot demonstrating real-time search filtering by keyword with matched results.*
>
> `![Search and Filter](assets/screenshots/search-filter.png)`

### 3. Shopping Cart Drawer
> *Placeholder: Add screenshot showing the slide-out cart drawer with items, quantity steppers, and subtotal.*
>
> `![Shopping Cart Drawer](assets/screenshots/cart-drawer.png)`

### 4. Skeleton Loading State
> *Placeholder: Add screenshot of shimmering skeleton cards rendering while data loads.*
>
> `![Loading Skeletons](assets/screenshots/loading-skeletons.png)`

### 5. Error Banner & Retry Action
> *Placeholder: Add screenshot of accessible error banner with Retry button when offline or API fails.*
>
> `![Error Banner](assets/screenshots/error-banner.png)`

---

## ♿ Accessibility (WCAG 2.1 AA)

* **Landmarks & Structure:** Clear hierarchical structure using `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, and `<aside>`.
* **Form Inputs:** Fully labeled search input with visually hidden accessible `<label>` and clear action button.
* **Buttons & Controls:** Every interactive element has descriptive text or explicit `aria-label`.
* **Dynamic Notifications:** Real-time search count and alerts use `aria-live="polite"` and `aria-live="assertive"`.
* **Cart Modal Drawer:** Designated as `role="dialog"` with `aria-modal="true"`, focus trapped inside, and dismissible via `Escape` key or backdrop click.
* **Keyboard Focus:** Visible, high-contrast `:focus-visible` rings on all active elements.
