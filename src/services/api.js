import axios from "axios";
import { debugLog, debugError } from "../utils/debug";

// API base configuration using Vite env (must be prefixed with VITE_)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Debug: Log all available VITE_ environment variables in development
if (import.meta.env.DEV) {
  console.log("[API Debug] Available VITE_ variables:", {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL, // Check for wrong variable name
    VITE_MAIN_DOMAIN: import.meta.env.VITE_MAIN_DOMAIN,
  });
}

// Production validation - throw error if VITE_API_BASE_URL is missing in production
if (!API_BASE_URL && import.meta.env.PROD) {
  console.error(
    "CRITICAL: VITE_API_BASE_URL environment variable is not set in production. " +
      "This will cause API connection failures. Please configure this variable in your Vercel/Netlify settings.",
  );
}

// Validate the URL format
if (API_BASE_URL) {
  try {
    new URL(API_BASE_URL);
  } catch (e) {
    console.error(
      "CRITICAL: VITE_API_BASE_URL is not a valid URL:",
      API_BASE_URL,
    );
  }
}

// Fallback for development only
const resolvedBaseUrl = API_BASE_URL || "http://localhost:5000/api";

debugLog("api", "Initializing with base URL", {
  url: resolvedBaseUrl,
  isProduction: import.meta.env.PROD,
  hasEnvVar: !!API_BASE_URL,
  envType: typeof API_BASE_URL,
});

// Log in production for debugging
if (import.meta.env.PROD) {
  console.log("[API] Production configuration:");
  console.log("  - VITE_API_BASE_URL:", API_BASE_URL || "NOT SET");
  console.log("  - Resolved baseURL:", resolvedBaseUrl);
  console.log("  - Window location:", window.location.href);
}

// Create Axios instance
const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Allow cookies if needed in future; CORS now handles this correctly
});

// Attach token to every request automatically
api.interceptors.request.use(
  (config) => {
    const adminToken =
      localStorage.getItem("admin_token") || localStorage.getItem("adminToken");
    const normalToken = localStorage.getItem("token");
    if (!config.headers) {
      config.headers = {};
    }

    const requestUrl = String(config.url || "").toLowerCase();
    const isAuthEndpoint =
      /\/(patients|doctors|secretaries)\/(login|register)/i.test(requestUrl);
    const isAdminEndpoint = /(^\/?admin(\/|$))|(^\/?api\/admin(\/|$))/i.test(
      requestUrl,
    );

    if (isAuthEndpoint) {
      if (import.meta.env.DEV) {
        debugLog("api:request", "Skipping auth token for auth endpoint", {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
      }
      return config;
    }

    if (isAdminEndpoint) {
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
        debugLog("api:request", "Attaching admin token", {
          method: config.method?.toUpperCase(),
          url: config.url,
          adminTokenPresent: true,
        });
      }
      return config;
    }

    if (normalToken) {
      config.headers.Authorization = `Bearer ${normalToken}`;
      debugLog("api:request", "Attaching auth token", {
        method: config.method?.toUpperCase(),
        url: config.url,
        tokenPresent: true,
      });
    } else if (import.meta.env.DEV) {
      debugLog("api:request", "No auth token available", {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
    }

    return config;
  },
  (error) => {
    debugError("api:request", "Request error", error);
    return Promise.reject(error);
  },
);

export const setupInterceptors = (logout) => {
  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => {
      debugLog("api:response", "Response received", {
        status: response.status,
        url: response.config?.url,
      });
      return response;
    },
    (error) => {
      debugError("api:response", "Response error", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
      });

      // Only logout on authentication failures, not business logic errors
      if (error.response?.status === 401) {
        const message = error.response?.data?.message || "";

        // Don't logout on business logic 401s (like "Patient not found", "Secretary not found", etc.)
        // Only logout on actual auth failures
        if (
          message.includes("not authorized") ||
          message.includes("token") ||
          message.includes("No token")
        ) {
          debugLog("api:response", "401 Auth failure - logging out");
          if (typeof logout === "function") {
            logout();
          }
        } else {
          debugLog(
            "api:response",
            "401 Business logic error - not logging out",
            { message },
          );
        }
      }
      return Promise.reject(error);
    },
  );
};

export default api;
