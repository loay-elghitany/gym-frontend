const AUTH_TOKEN_KEY = "token";

export const getAuthToken = () => {
  return typeof window !== "undefined"
    ? localStorage.getItem(AUTH_TOKEN_KEY)
    : null;
};

export const setAuthToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

export const parseJwtToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const base64Payload = token.split(".")[1] || "";
    const payload = decodeURIComponent(
      atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};
