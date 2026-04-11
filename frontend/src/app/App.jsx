import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import { AuthProvider } from "../features/auth/authProvider.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import RequireAuth from "../routes/requireAuth.jsx";
import PublicOnly from "../routes/PublicOnly.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

import MapPage from "../pages/map/MapPage.jsx";
import ProfilePage from "../pages/profile/ProfilePage.jsx";

function LandingRoute() {
  const [sliderResetKey, setSliderResetKey] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const goLogin = () => navigate("/login");
  const goRegister = () => navigate("/register");
  const goApp = () => navigate("/app/map");

  const doLogout = async () => {
    await logout();
    setSliderResetKey((prev) => prev + 1);
    navigate("/", { replace: true });
  };

  return (
    <LandingPage
      onGoLogin={goLogin}
      onGoRegister={goRegister}
      sliderResetKey={sliderResetKey}
      disabled={false}
      user={user}
      onGoApp={goApp}
      onLogout={doLogout}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingRoute />} />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnly>
                <RegisterPage />
              </PublicOnly>
            }
          />

          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="map" replace />} />
            <Route path="map" element={<MapPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}