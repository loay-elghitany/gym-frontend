import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/axios";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  parseJwtToken,
} from "../utils/authHelpers";
import {
  normalizeAuthRole,
  normalizeTenantInfo,
  normalizeGamification,
} from "./authUtils";
import { AuthContext } from "./authContextValue";
import { detectTenantFromLocation } from "../utils/tenantUtils";
import { debugLog, debugError } from "../utils/debug";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTenantVerified, setIsTenantVerified] = useState(false);
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
    } catch {
      // ignore
    }
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setTenant(null);
    setIsTenantVerified(false);
    setLoading(false);

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
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

      const tokenPayload = parseJwtToken(token);

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

      const fallbackTenant = normalizeTenantInfo({
        slug: tokenPayload?.tenantSlug || tokenPayload?.tenant?.slug,
      });
      if (fallbackTenant) {
        setTenant(fallbackTenant);
      }

      let profile;
      try {
        const response = await api.get("/auth/me");
        if (!response?.data) {
          throw new Error("Unable to fetch user profile");
        }

        const fetchedProfile = response.data.data || response.data;
        profile =
          fetchedProfile && typeof fetchedProfile === "object"
            ? {
                ...fetchedProfile,
                subscription:
                  fetchedProfile.subscription &&
                  typeof fetchedProfile.subscription === "object"
                    ? { ...fetchedProfile.subscription }
                    : fetchedProfile.subscription,
                package:
                  fetchedProfile.package &&
                  typeof fetchedProfile.package === "object"
                    ? { ...fetchedProfile.package }
                    : fetchedProfile.package,
                gamification: normalizeGamification(
                  fetchedProfile.gamification,
                ),
              }
            : fetchedProfile;
      } catch (profileError) {
        if (role === "super_admin") {
          debugLog(
            "AuthContext:loadUser",
            "Super admin profile fetch failed, retaining auth",
            { error: profileError?.message },
          );
          profile = {
            name: tokenPayload?.name || tokenPayload?.email || "Super Admin",
            email: tokenPayload?.email || null,
            role: rawRole,
          };
        } else {
          throw profileError;
        }
      }

      if (!profile) {
        throw new Error("Unable to fetch user profile");
      }

      const profileTenant = normalizeTenantInfo(
        profile?.tenant || profile?.tenantSlug || profile,
      );
      if (profileTenant) {
        setTenant(profileTenant);
        setIsTenantVerified(true);
      } else if (fallbackTenant) {
        // ✅ If we have a fallbackTenant from JWT but profile doesn't have tenant,
        // still mark as verified since we've completed the async check
        setIsTenantVerified(true);
      } else {
        // ✅ Mark as verified even if no tenant found, so error page can be shown
        // instead of staying in infinite loading state
        setIsTenantVerified(true);
      }

      setUser(profile);
      setIsAuthenticated(true);
      debugLog("AuthContext:loadUser", "User profile loaded", {
        role,
        userName: profile?.name,
        tenant: profileTenant?.slug || fallbackTenant?.slug,
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
        setTenant(null);
        setIsTenantVerified(true);
        setLoading(false);
        return;
      }

      try {
        await loadUserFromToken(token);
      } catch (error) {
        debugError("AuthContext:init", "Failed to initialize auth", error);
        logout();
        return;
      }

      setLoading(false);
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
      try {
        api.interceptors.response.eject(responseInterceptorId);
      } catch {
        /* ignore */
      }
    };
  }, [isAuthenticated, logout]);

  const login = useCallback(
    async (email, password, options = {}) => {
      const tenantSlug = options?.tenantSlug || tenant?.slug || null;
      debugLog("AuthContext:login", "Attempting login", { email, tenantSlug });

      try {
        const response = await api.post("/auth/login", {
          email,
          password,
          tenantSlug,
        });

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

        setAuthToken(token);
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
          }
        } catch {
          /* ignore storage errors */
        }

        const tokenPayload = parseJwtToken(token);

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

        const loginTenant = normalizeTenantInfo({
          slug: tokenPayload?.tenantSlug || tokenPayload?.tenant?.slug,
        });
        if (loginTenant) {
          setTenant(loginTenant);
          if (typeof window !== "undefined") {
            localStorage.setItem("tenant_slug", loginTenant.slug);
          }
        }

        let profile = null;
        try {
          const profileResponse = await api.get("/auth/me");
          profile = profileResponse?.data?.data || profileResponse?.data;
          if (profile && typeof profile === "object") {
            profile = {
              ...profile,
              subscription:
                profile.subscription && typeof profile.subscription === "object"
                  ? { ...profile.subscription }
                  : profile.subscription,
              package:
                profile.package && typeof profile.package === "object"
                  ? { ...profile.package }
                  : profile.package,
              gamification: normalizeGamification(profile.gamification),
            };
          }
          if (!profile) {
            throw new Error("Failed to load profile after login");
          }
        } catch (profileError) {
          if (role === "super_admin") {
            debugLog(
              "AuthContext:login",
              "Super admin profile fetch failed, preserving login state",
              { error: profileError?.message },
            );
            profile = {
              name: tokenPayload?.name || tokenPayload?.email || "Super Admin",
              email: tokenPayload?.email || null,
              role: rawRole,
            };
          } else {
            throw profileError;
          }
        }

        const profileTenant = normalizeTenantInfo(
          profile?.tenant || profile?.tenantSlug || profile,
        );
        if (profileTenant) {
          setTenant(profileTenant);
          setIsTenantVerified(true);
        } else if (loginTenant) {
          // ✅ If we have loginTenant from JWT but profile doesn't have tenant,
          // still mark as verified since we've completed the async check
          setIsTenantVerified(true);
        } else {
          // ✅ Mark as verified even if no tenant found, so error page can be shown
          setIsTenantVerified(true);
        }

        setUser(profile);
        setIsAuthenticated(true);
        debugLog("AuthContext:login", "Login completed", {
          role,
          userName: profile?.name,
          tenant: profileTenant?.slug || loginTenant?.slug,
        });
        return profile;
      } catch (error) {
        debugError("AuthContext:login", "Login failed", error);
        clearAuthToken();
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
        } catch {
          /* ignore */
        }
        setUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setTenant(null);
        setIsTenantVerified(false);
        throw error;
      }
    },
    [tenant],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      isTenantVerified,
      userRole,
      isAdmin: userRole === "super_admin",
      tenant,
      login,
      logout,
      fetchCurrentUser: async () => {
        try {
          const resp = await api.get("/auth/me");
          const profile = resp?.data?.data || resp?.data || null;
          const retainedProfile =
            profile && typeof profile === "object"
              ? {
                  ...profile,
                  subscription:
                    profile.subscription &&
                    typeof profile.subscription === "object"
                      ? { ...profile.subscription }
                      : profile.subscription,
                  package:
                    profile.package && typeof profile.package === "object"
                      ? { ...profile.package }
                      : profile.package,
                  gamification: normalizeGamification(profile.gamification),
                }
              : profile;
          if (retainedProfile) {
            setUser(retainedProfile);
            setIsAuthenticated(true);
            const profileTenant = normalizeTenantInfo(
              retainedProfile?.tenant ||
                retainedProfile?.tenantSlug ||
                retainedProfile,
            );
            if (profileTenant) {
              setTenant(profileTenant);
              setIsTenantVerified(true);
            }
          }
          return profile;
        } catch {
          return null;
        }
      },
    }),
    [
      user,
      isAuthenticated,
      loading,
      isTenantVerified,
      userRole,
      tenant,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
