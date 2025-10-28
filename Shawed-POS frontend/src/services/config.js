// Centralized API configuration
// Ensures consistent base URL with the required "/api" prefix across environments

const defaultBase = 'https://shawed-pos.onrender.com';

// Prefer env var (Vite) if provided, otherwise fallback to Render host
const rawBaseUrl = import.meta?.env?.VITE_API_BASE?.trim?.() || defaultBase;

// Normalize to ensure no trailing slash
const normalizedOrigin = rawBaseUrl.replace(/\/$/, '');

// Always append "/api" once
export const API_BASE_URL = `${normalizedOrigin}/api`;

export default {
  API_BASE_URL,
};


