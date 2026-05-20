import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { detectTenantFromLocation } from "../utils/tenantUtils";
import FeaturePlaceholder from "../components/FeaturePlaceholder";
import GymOwnerDashboard from "../pages/gym-owner/GymOwnerDashboard";
import MembersPage from "../pages/gym-owner/MembersPage";
import ReportsPage from "../pages/gym-owner/ReportsPage";
import LoginPage from "../pages/auth/LoginPage";
import MemberDashboard from "../pages/member/MemberDashboard";
import MemberProfile from "../pages/member/MemberProfile";
import MyPlans from "../pages/member/MyPlans";
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard";
import TenantLandingPage from "../pages/tenant/TenantLandingPage";
import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard";
import TrainerDashboard from "../pages/trainer/TrainerDashboard";
import TenantLayout from "../components/TenantLayout";
import TenantNotFoundPage from "../pages/error/TenantNotFoundPage";
import NotFoundPage from "../pages/error/NotFoundPage";

const normalizeRouteRole = (rawRole) => {
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

const ProtectedRoute = ({ allowedRoles, requireTenant = true, children }) => {
  const { isAuthenticated, loading, userRole, tenant } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-lg shadow-slate-900/5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-sky-600" />
          <span className="text-sm font-medium text-slate-700">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  if (requireTenant && !tenant?.slug) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedRole = normalizeRouteRole(userRole);
  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const TenantRoute = () => {
  const tenantFromHost = detectTenantFromLocation(window.location);

  if (!tenantFromHost?.slug) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const DashboardRouter = () => {
  const { userRole } = useAuth();
  const normalizedRole = normalizeRouteRole(userRole);

  if (!normalizedRole) {
    return <Navigate to="/login" replace />;
  }

  if (normalizedRole === "super_admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  switch (normalizedRole) {
    case "gym_owner":
      return <Navigate to="/owner" replace />;
    case "receptionist":
      return <Navigate to="/reception" replace />;
    case "trainer":
      return <Navigate to="/trainer" replace />;
    case "member":
      return <MemberDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TenantLandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route element={<TenantRoute />}>
        <Route element={<TenantLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "gym_owner",
                  "receptionist",
                  "trainer",
                  "member",
                ]}
              >
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["gym_owner"]}>
                <GymOwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute allowedRoles={["gym_owner"]}>
                <MembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute allowedRoles={["gym_owner"]}>
                <FeaturePlaceholder
                  title="Subscriptions"
                  description="Track renewals, payment plans, and subscription health with a polished dashboard."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["gym_owner"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception"
            element={
              <ProtectedRoute allowedRoles={["receptionist"]}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkins"
            element={
              <ProtectedRoute allowedRoles={["receptionist"]}>
                <FeaturePlaceholder
                  title="Check-ins"
                  description="Manage arrival flow and attendance with fast check-in controls."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-member"
            element={
              <ProtectedRoute allowedRoles={["receptionist"]}>
                <FeaturePlaceholder
                  title="Register Member"
                  description="Quickly enroll new members with seamless front desk forms and onboarding."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <TrainerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <FeaturePlaceholder
                  title="Classes"
                  description="Plan, assign, and monitor classes with a streamlined trainer workspace."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbody"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <FeaturePlaceholder
                  title="InBody Records"
                  description="Review body composition sessions and measurement history for each member."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MemberProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-plans"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MyPlans />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<TenantNotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
