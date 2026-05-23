import { TENANT_PATH_PREFIX } from "../utils/tenantUtils";

export const normalizeAuthRole = (rawRole) => {
  if (!rawRole) {
    return null;
  }

  const roleString = String(rawRole).trim().toLowerCase();
  if (roleString.includes("super") || roleString.includes("admin")) {
    return "super_admin";
  }
  if (
    roleString.includes("gym_owner") ||
    roleString.includes("gymowner") ||
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

export const normalizeTenantInfo = (tenantInput) => {
  if (!tenantInput) {
    return null;
  }

  const rawSlug =
    (typeof tenantInput === "string" && tenantInput) ||
    tenantInput?.slug ||
    tenantInput?.tenantSlug ||
    tenantInput?.tenant?.slug ||
    null;
  const slug = rawSlug ? String(rawSlug).trim().toLowerCase() : null;
  if (!slug) {
    return null;
  }

  return {
    slug,
    displayName:
      tenantInput?.displayName ||
      slug.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    pathPrefix: `/${TENANT_PATH_PREFIX}/${slug}`,
    urlBase:
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : undefined,
  };
};

const computeGamificationRank = (points) => {
  const numericPoints = Number(points || 0);
  if (numericPoints >= 1501) return "Gold";
  if (numericPoints >= 501) return "Silver";
  return "Bronze";
};

export const normalizeGamification = (gamification) => {
  const points = Number(gamification?.points || 0);
  return {
    ...(gamification && typeof gamification === "object" ? gamification : {}),
    points,
    rank: computeGamificationRank(points),
  };
};
