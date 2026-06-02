import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContextValue";
import { detectTenantFromLocation } from "../utils/tenantUtils";
import FeaturePlaceholder from "../components/FeaturePlaceholder";
import GymOwnerDashboard from "../pages/gym-owner/GymOwnerDashboard";
import LandingPageBuilder from "../pages/gym-owner/LandingPageBuilder";
import MembersPage from "../pages/gym-owner/MembersPage";
import ReportsPage from "../pages/gym-owner/ReportsPage";
import SubscriptionsPage from "../pages/gym-owner/SubscriptionsPage";
import LoginPage from "../pages/auth/LoginPage";
import MemberDashboard from "../pages/member/MemberDashboard";
import MemberProfile from "../pages/member/MemberProfile";
import MyPlans from "../pages/member/MyPlans";
import Leaderboard from "../pages/member/Leaderboard";
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard";
import TenantLandingPage from "../pages/tenant/TenantLandingPage";
import SuperAdminLayout from "../pages/super-admin/SuperAdminLayout";
import SuperAdminDashboard from "../pages/super-admin/SuperAdminDashboard";
import TenantDetails from "../pages/super-admin/TenantDetails";
import SaaSPlans from "../pages/super-admin/SaaSPlans";
import Broadcasts from "../pages/super-admin/Broadcasts";
import AuditLogs from "../pages/super-admin/AuditLogs";
import TrainerDashboard from "../pages/trainer/TrainerDashboard";
import TrainerClasses from "../pages/trainer/TrainerClasses";
import MemberClasses from "../pages/member/MemberClasses";
import InBodyRecords from "../pages/trainer/InBodyRecords";
import GymOwnerClasses from "../pages/gym-owner/GymOwnerClasses";
import WeeklyCheckIn from "../pages/member/WeeklyCheckIn";
import LeadsCRM from "../pages/gym-owner/LeadsCRM";
import QuickScanner from "../pages/owner/QuickScanner";
import TenantLayout from "../components/TenantLayout";
import TenantNotFoundPage from "../pages/error/TenantNotFoundPage";
import NotFoundPage from "../pages/error/NotFoundPage";
import GymLandingPage from "../pages/tenant/GymLandingPage";

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

const ProtectedRoute = ({ allowedRoles, requireTenant = true, children }) => {
  const { isAuthenticated, loading, isTenantVerified, userRole, tenant } =
    useAuth();
  const location = useLocation();

  if (loading || !isTenantVerified) {
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

  const normalizedRole = normalizeRouteRole(userRole);

  if (requireTenant && normalizedRole !== "super_admin" && !tenant?.slug) {
    <Route
      path="/owner/classes"
      element={
        <ProtectedRoute allowedRoles={["gym_owner"]}>
          <GymOwnerClasses />
        </ProtectedRoute>
      }
    />;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const normalizedAllowedRoles =
    allowedRoles?.map((role) => normalizeRouteRole(role)) || [];

  if (allowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
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

const RootLandingRoute = () => {
  if (typeof window === "undefined") {
    return <TenantLandingPage />;
  }

  const tenantFromHost = detectTenantFromLocation(window.location);
  if (tenantFromHost?.slug) {
    return <GymLandingPage />;
  }

  return <TenantLandingPage />;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootLandingRoute />} />
      <Route path="/admin-login" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="tenants" element={<SuperAdminDashboard />} />
        <Route path="tenants/:id" element={<TenantDetails />} />
        <Route path="plans" element={<SaaSPlans />} />
        <Route path="broadcasts" element={<Broadcasts />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

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
                <SubscriptionsPage />
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
            path="/owner/landing-page"
            element={
              <ProtectedRoute allowedRoles={["gym_owner"]}>
                <LandingPageBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/leads"
            element={
              <ProtectedRoute allowedRoles={["gym_owner"]}>
                <LeadsCRM />
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
                <TrainerClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbody"
            element={
              <ProtectedRoute allowedRoles={["trainer"]}>
                <InBodyRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quick-scanner"
            element={
              <ProtectedRoute
                allowedRoles={["gym_owner", "receptionist", "trainer"]}
              >
                <QuickScanner />
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
            path="/my-classes"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <MemberClasses />
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
          <Route
            path="/weekly-checkins"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <WeeklyCheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <Leaderboard />
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
