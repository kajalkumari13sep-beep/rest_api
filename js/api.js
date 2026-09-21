/**
 * api.js - RESTful API Client
 * Handles asynchronous communication with the Fake Store REST API.
 * Keeps network and HTTP communication decoupled from UI and DOM logic.
 */

const API_BASE_URL = 'https://fakestoreapi.com/products';
const CACHE_KEY = 'fakestore_products_cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache validity

/**
 * Custom API Error with status information
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   */
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Retrieves cached product data if available and fresh.
 * @returns {Array|null}
 */
function getCachedProducts() {
  try {
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (!rawCache) return null;

    const parsed = JSON.parse(rawCache);
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    if (Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data;
    }
  } catch {
    // If cache read fails, silently fallback to network fetch
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
}

/**
 * Stores product data in localStorage with current timestamp.
 * @param {Array} data
 */
function setCachedProducts(data) {
  try {
    const cachePayload = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

/**
 * Clears the products cache.
 */
export function clearProductsCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore error
  }
}

/**
 * Fetches products from the Fake Store API using fetch() and async/await.
 * Implements HTTP response verification, error classification, and client-side caching.
 *
 * @param {Object} [options]
 * @param {boolean} [options.forceRefresh=false] - If true, bypasses cache
 * @returns {Promise<Array>} List of product items
 */
export async function fetchProducts({ forceRefresh = false } = {}) {
  // Check local cache if forceRefresh is false
  if (!forceRefresh) {
    const cached = getCachedProducts();
    if (cached) {
      return cached;
    }
  }

  let response;
  try {
    response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });
  } catch (networkError) {
    // Differentiate between offline/network failures and HTTP errors
    throw new ApiError(
      'Unable to connect to the store server. Please check your internet connection and try again.',
      0
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Server responded with error status ${response.status} (${response.statusText || 'Unknown'}).`,
      response.status
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    throw new ApiError('Failed to parse product data from server response.', response.status);
  }

  if (!Array.isArray(data)) {
    throw new ApiError('Received invalid data format from the store API.', response.status);
  }

  // Cache valid response
  setCachedProducts(data);

  return data;
}
