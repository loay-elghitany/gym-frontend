import axios from "axios";
import { getTenantSlugFromHost } from "../utils/tenantUtils";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach auth token and tenant slug from the browser hostname to every request
api.interceptors.request.use(
  (config) => {
    try {
      const token =
        typeof window !== "undefined" && localStorage.getItem("token");
      const tenantSlug =
        typeof window !== "undefined"
          ? getTenantSlugFromHost(window.location.hostname)
          : null;

      if (!config.headers) config.headers = {};
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (tenantSlug) config.headers["x-tenant-slug"] = tenantSlug;
    } catch (e) {
      // ignore in SSR or unusual environments
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Simple response interceptor to surface errors; avoid automatic logout here
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
