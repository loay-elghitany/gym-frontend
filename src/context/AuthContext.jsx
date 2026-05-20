import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import api from "../api/axios";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  parseJwtToken,
} from "../utils/authHelpers";
import { detectTenantFromLocation } from "../utils/tenantUtils";
import { debugLog, debugError } from "../utils/debug";

const normalizeAuthRole = (rawRole) => {
  if (!rawRole) {
    return null;
  }

  const roleString = String(rawRole).trim().toLowerCase();
  if (roleString.includes("super") || roleString.includes("admin")) {
    return "super_admin";
  }
  if (
    roleString.includes("gym_owner") ||
    roleString === "owner" ||
    roleString.includes("owner")
  ) {
    return "gym_owner";
  }
  if (roleString.includes("reception")) {
    return "receptionist";
  }
  if (roleString.includes("trainer")) {
    return "trainer";
  }
  if (roleString.includes("member")) {
    return "member";
  }

  return roleString;
};

const defaultAuthContextValue = {
  user: null,
  isAuthenticated: false,
  loading: true,
  userRole: null,
  isAdmin: false,
  tenant: null,
  login: async () => {},
  logout: () => {},
};

export const AuthContext = createContext(defaultAuthContextValue);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [tenant, setTenant] = useState(() =>
    detectTenantFromLocation(window.location),
  );

  const logout = useCallback(() => {
    debugLog("AuthContext:logout", "Logging out user");
    try {
      clearAuthToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("tenant_slug");
      }
    } catch (e) {
      // ignore
    }
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setLoading(false);

    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    // Ensure API response interceptor triggers logout on 401
    const responseInterceptorId = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error?.response?.status === 401) {
          debugLog("AuthContext:api", "401 received, logging out");
          logout();
        }
        return Promise.reject(error);
      },
    );

    const loadUserFromToken = async (token) => {
      setAuthToken(token);
      debugLog("AuthContext:loadUser", "Token found, fetching profile");

      // Attempt to decode token for role information. Be permissive if missing.
      const tokenPayload = parseJwtToken(token);
      // Log token context to help debug backend shapes
      // eslint-disable-next-line no-console
      console.log("Decoded Token / User Role Context:", token, tokenPayload);

      const rawRole =
        tokenPayload?.role ||
        tokenPayload?.roles?.[0] ||
        tokenPayload?.user?.role ||
        tokenPayload?.user?.role?.name ||
        tokenPayload?.roleName ||
        tokenPayload?.role_type ||
        tokenPayload?.roleType;
      const role = normalizeAuthRole(rawRole) || "member";
      setUserRole(role);
      debugLog("AuthContext:loadUser", "Token decoded", { role, rawRole });

      const response = await api.get("/auth/me");
      if (!response?.data) {
        throw new Error("Unable to fetch user profile");
      }

      // Support both { data: { data: user } } and { data: user }
      const profile = response.data.data || response.data;
      setUser(profile);
      setIsAuthenticated(true);
      debugLog("AuthContext:loadUser", "User profile loaded", {
        role,
        userName: profile?.name,
      });
    };

    const initializeAuth = async () => {
      debugLog("AuthContext:init", "Checking for token and tenant context");

      const token = getAuthToken();
      if (!token) {
        debugLog("AuthContext:init", "No token found");
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        await loadUserFromToken(token);
      } catch (error) {
        debugError("AuthContext:init", "Failed to initialize auth", error);
        logout();
      }

      setLoading(false);

      // cleanup interceptor on unmount
      return () => {
        try {
          api.interceptors.response.eject(responseInterceptorId);
        } catch (e) {
          /* ignore */
        }
      };
    };

    initializeAuth();

    const handleStorageChange = () => {
      const currentToken = getAuthToken();
      if (!currentToken && isAuthenticated) {
        debugLog(
          "AuthContext:storage",
          "Token removed from storage, logging out",
        );
        logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, logout]);

  const login = useCallback(
    async (email, password) => {
      const tenantSlug = tenant?.slug || null;
      debugLog("AuthContext:login", "Attempting login", { email, tenantSlug });

      try {
        const response = await api.post("/auth/login", {
          email,
          password,
          tenantSlug,
        });

        // Support multiple backend shapes for the token:
        // - response.data.token
        // - response.data.data.token
        // - response.data.user.token
        // - response.data.accessToken
        const maybe = (obj, path) =>
          path.split(".").reduce((acc, key) => acc && acc[key], obj);

        const candidates = [
          "data.token",
          "data.data.token",
          "data.user.token",
          "data.accessToken",
          "accessToken",
        ];

        let token = null;
        for (const p of candidates) {
          const t = maybe(response, p);
          if (t) {
            token = t;
            break;
          }
        }

        if (!token) {
          throw new Error("Login response did not contain a token");
        }

        // Normalize and persist token
        setAuthToken(token);
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
          }
        } catch (e) {
          /* ignore storage errors */
        }

        // Decode token to infer role when available, but don't block login
        const tokenPayload = parseJwtToken(token);
        // eslint-disable-next-line no-console
        console.log("Decoded Token / User Role Context:", token, tokenPayload);

        const rawRole =
          tokenPayload?.role ||
          tokenPayload?.roles?.[0] ||
          tokenPayload?.user?.role ||
          tokenPayload?.user?.role?.name ||
          tokenPayload?.roleName ||
          tokenPayload?.role_type ||
          tokenPayload?.roleType;
        const role = normalizeAuthRole(rawRole) || "member";
        setUserRole(role);
        debugLog("AuthContext:login", "Token decoded", { role, rawRole });

        const profileResponse = await api.get("/auth/me");
        const profile = profileResponse?.data?.data || profileResponse?.data;
        if (!profile) {
          throw new Error("Failed to load profile after login");
        }

        setUser(profile);
        setIsAuthenticated(true);
        debugLog("AuthContext:login", "Login completed", {
          role,
          userName: profile?.name,
        });
        return profile;
      } catch (error) {
        debugError("AuthContext:login", "Login failed", error);
        clearAuthToken();
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
        } catch (e) {
          /* ignore */
        }
        setUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        throw error;
      }
    },
    [tenant, logout],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      userRole,
      isAdmin: userRole === "super_admin",
      tenant,
      login,
      logout,
      fetchCurrentUser: async () => {
        try {
          const resp = await api.get("/auth/me");
          const profile = resp?.data?.data || resp?.data || null;
          if (profile) {
            setUser(profile);
            setIsAuthenticated(true);
          }
          return profile;
        } catch (e) {
          return null;
        }
      },
    }),
    [user, isAuthenticated, loading, userRole, tenant, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
