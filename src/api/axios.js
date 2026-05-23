import axios from "axios";
import { getTenantSlugFromHost } from "../utils/tenantUtils";

// التعديل هنا: هيقرأ من إعدادات Vercel الأول، ولو ملقاش هيشتغل محلي
const envUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BASE_URL = envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;

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
      let tenantSlug =
        typeof window !== "undefined"
          ? getTenantSlugFromHost(window.location.hostname)
          : null;
      const savedTenantSlug =
        typeof window !== "undefined" && localStorage.getItem("tenant_slug");

      if (!tenantSlug && savedTenantSlug) {
        tenantSlug = savedTenantSlug;
      }

      if (!config.headers) config.headers = {};
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (tenantSlug) config.headers["x-tenant-slug"] = tenantSlug;
    } catch {
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
