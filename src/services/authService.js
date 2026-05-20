import api from "./api";

const authService = {
  login: (email, password, tenantSlug) => {
    return api.post("/auth/login", {
      email,
      password,
      tenantSlug,
    });
  },

  getProfile: () => {
    return api.get("/auth/profile");
  },

  getGymDetails: (tenantSlug) => {
    return api.get(`/tenants/${tenantSlug}`);
  },
};

export default authService;
