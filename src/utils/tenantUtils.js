export const TENANT_PATH_PREFIX = "gym";

export const getTenantSlugFromHost = (hostname) => {
  if (!hostname) {
    return null;
  }

  const host = hostname.replace(/:\d+$/, "");
  const hostParts = host.split(".");

  if (hostParts.length === 2 && hostParts[1] === "localhost") {
    return hostParts[0].toLowerCase();
  }

  if (hostParts.length >= 3) {
    return hostParts[0].toLowerCase();
  }

  return null;
};

export const getTenantSlugFromPath = (pathname) => {
  if (!pathname) {
    return null;
  }

  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  const pathParts = normalized.split("/");

  if (pathParts[0] === TENANT_PATH_PREFIX && pathParts[1]) {
    return pathParts[1].toLowerCase();
  }

  return null;
};

export const detectTenantFromLocation = (location) => {
  if (!location) {
    return null;
  }

  const tenantSlug =
    getTenantSlugFromPath(location.pathname) ||
    getTenantSlugFromHost(location.hostname);
  if (!tenantSlug) {
    return null;
  }

  return {
    slug: tenantSlug,
    displayName: tenantSlug
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    urlBase: `${location.protocol}//${location.host}`,
    pathPrefix: `/${TENANT_PATH_PREFIX}/${tenantSlug}`,
  };
};

export const buildTenantDashboardPath = (tenantSlug) => {
  return `/${TENANT_PATH_PREFIX}/${tenantSlug}/dashboard`;
};
