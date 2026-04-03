import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ProtectedScreen from "../pages/ProtectedScreen.jsx";
import { AuthProvider } from "../features/auth/authProvider.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import RequireAuth from "../routes/requireAuth.jsx";
import PublicOnly from "../routes/PublicOnly.jsx";

function LandingRoute() {
  const [sliderResetKey, setSliderResetKey] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const goLogin = () => navigate("/login");
  const goRegister = () => navigate("/register");
  const goApp = () => navigate("/app");

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
                <ProtectedScreen />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}